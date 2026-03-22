import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

interface Inputs {
  modelsPath: string
  format: string
  githubToken: string
}

interface ReportData {
  project: { modelsAnalyzed: number }
  summary: { critical: number; high: number; medium: number; low: number; total: number }
  findings: Array<{
    id: string
    type: string
    severity: string
    model: string
    title: string
    description: string
  }>
}

async function getInputs(): Promise<Inputs> {
  return {
    modelsPath: process.env.INPUT_MODELS_PATH || 'models',
    format: process.env.INPUT_FORMAT || 'html',
    githubToken: process.env.INPUT_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '',
  }
}

function getGitHubContext(): {
  repo: string
  prNumber: number | null
  eventPath: string
} {
  const repo = process.env.GITHUB_REPOSITORY || ''
  const eventPath = process.env.GITHUB_EVENT_PATH || ''

  let prNumber: number | null = null
  if (eventPath && fs.existsSync(eventPath)) {
    try {
      const event = JSON.parse(fs.readFileSync(eventPath, 'utf-8'))
      prNumber = event.pull_request?.number || null
    } catch {
      // Silent fail - event might not be a PR event
    }
  }

  return { repo, prNumber, eventPath }
}

async function runAudit(modelsPath: string, format: string): Promise<ReportData | null> {
  try {
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd()
    const fullPath = path.join(workspace, modelsPath)

    // Run orvyen CLI with JSON output
    // Use npx orvyen directly instead of trying to find the bundled CLI
    const cmd = `npx orvyen "${fullPath}" --format json`
    
    console.log(`Running: ${cmd}`)
    
    let output = ''
    let stderr = ''
    
    try {
      output = execSync(cmd, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (error: any) {
      // Capture buffer output even on error (exit code 1 is expected for critical findings)
      if (error.stdout && typeof error.stdout === 'string') {
        output = error.stdout
      } else if (error.stdout && Buffer.isBuffer(error.stdout)) {
        output = error.stdout.toString('utf-8')
      }
      if (error.stderr && typeof error.stderr === 'string') {
        stderr = error.stderr
      }
    }

    if (!output) {
      console.error('No output from audit')
      if (stderr) {
        console.error('Stderr:', stderr)
      }
      return null
    }

    // Extract JSON from mixed output (find first { and last })
    const jsonStart = output.indexOf('{')
    const jsonEnd = output.lastIndexOf('}')
    
    if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
      console.error('Could not find JSON in output')
      console.error('Output length:', output.length)
      return null
    }

    const jsonStr = output.substring(jsonStart, jsonEnd + 1)
    let auditResult: any
    
    try {
      auditResult = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError)
      console.error('JSON string:', jsonStr.substring(0, 200))
      return null
    }
    
    // Transform CLI output to ReportData format
    const report: ReportData = {
      project: {
        modelsAnalyzed: auditResult.models || 0,
      },
      summary: {
        critical: (auditResult.findings || []).filter((f: any) => f.severity === 'critical').length,
        high: (auditResult.findings || []).filter((f: any) => f.severity === 'high').length,
        medium: (auditResult.findings || []).filter((f: any) => f.severity === 'medium').length,
        low: (auditResult.findings || []).filter((f: any) => f.severity === 'low').length,
        total: (auditResult.findings || []).length,
      },
      findings: auditResult.findings || [],
    }
    
    return report
  } catch (error) {
    console.error('Failed to run audit:', error)
    return null
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath)
    return true
  } catch {
    return false
  }
}

function formatCommentBody(report: ReportData, reportPath: string): string {
  const { summary } = report
  const { critical, high, medium, low, total } = summary

  if (total === 0) {
    return '✅ **Orvyen Audit Complete** — No findings! Your SQL architecture is clean.'
  }

  let comment = `## 🔍 Orvyen SQL Audit Report\n\n`

  // Summary section
  comment += `### Summary\n`
  comment += `- **Models analyzed**: ${report.project.modelsAnalyzed}\n`
  comment += `- **Total findings**: ${total}\n\n`

  // Severity breakdown
  if (critical > 0) {
    comment += `🔴 **Critical**: ${critical}\n`
  }
  if (high > 0) {
    comment += `🟠 **High**: ${high}\n`
  }
  if (medium > 0) {
    comment += `🟡 **Medium**: ${medium}\n`
  }
  if (low > 0) {
    comment += `🟢 **Low**: ${low}\n`
  }

  comment += `\n### Top Issues\n\n`

  // Group by severity
  const bySeverity: Record<string, typeof report.findings> = {}
  for (const finding of report.findings) {
    if (!bySeverity[finding.severity]) {
      bySeverity[finding.severity] = []
    }
    bySeverity[finding.severity].push(finding)
  }

  const severityOrder = ['critical', 'high', 'medium', 'low']
  for (const severity of severityOrder) {
    const findings = bySeverity[severity] || []
    if (findings.length === 0) continue

    const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢'
    comment += `#### ${icon} ${severity.toUpperCase()}\n`

    for (const finding of findings.slice(0, 5)) {
      comment += `- **${finding.model}**: ${finding.title}\n`
    }

    if (findings.length > 5) {
      comment += `- ...and ${findings.length - 5} more\n`
    }
    comment += '\n'
  }

  // Link to full report
  if (reportPath) {
    comment += `📊 [View Full Report](${reportPath})\n\n`
  }

  comment += `---\n_Generated by [Orvyen](https://github.com/orvy/orvyen)_\n`

  return comment
}

async function postComment(
  repo: string,
  prNumber: number,
  githubToken: string,
  commentBody: string
): Promise<boolean> {
  if (!repo || !prNumber || !githubToken) {
    console.log('Skipping comment post: missing repo, PR number, or token')
    return false
  }

  const [owner, repoName] = repo.split('/')
  const url = `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Orvyen-Action',
      },
      body: JSON.stringify({ body: commentBody }),
    })

    if (!response.ok) {
      console.error(`Failed to post comment: ${response.status} ${response.statusText}`)
      return false
    }

    console.log('✅ Posted comment to PR')
    return true
  } catch (error) {
    console.error('Failed to post comment:', error)
    return false
  }
}

function setOutput(name: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT
  if (outputFile) {
    fs.appendFileSync(outputFile, `${name}=${value}\n`)
  }
}

async function main() {
  console.log('🔍 Orvyen GitHub Action starting...\n')

  const inputs = await getInputs()
  const context = getGitHubContext()

  console.log(`Models path: ${inputs.modelsPath}`)
  console.log(`Format: ${inputs.format}`)
  console.log(`Repo: ${context.repo}`)
  console.log(`PR: ${context.prNumber || 'not a PR event'}\n`)

  // Run audit
  const report = await runAudit(inputs.modelsPath, inputs.format)
  if (!report) {
    console.error('❌ Audit failed')
    process.exit(1)
  }

  const { summary, project } = report
  console.log(`✅ Audit complete: ${project.modelsAnalyzed} models, ${summary.total} findings\n`)

  // Set outputs
  setOutput('findings-count', String(summary.total))
  setOutput('critical-count', String(summary.critical))

  const reportPath = path.join(process.env.GITHUB_WORKSPACE || '', '.orvyen', 'report.html')
  setOutput('report-path', reportPath)

  // Post comment if PR
  if (context.prNumber) {
    const commentBody = formatCommentBody(report, `https://github.com/${context.repo}/actions/runs/${process.env.GITHUB_RUN_ID}`)
    await postComment(context.repo, context.prNumber, inputs.githubToken, commentBody)
  } else {
    console.log('ℹ️ Not a PR event - skipping comment post')
  }

  // Exit with error if critical findings
  if (summary.critical > 0) {
    console.log(`\n⚠️ Critical findings detected. Exit code: 1`)
    process.exit(1)
  }

  console.log('\n✅ Action completed successfully')
  process.exit(0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

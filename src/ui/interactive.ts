import prompts from 'prompts'
import path from 'path'
import chalk from 'chalk'
import { runAudit } from '../cli/commands/audit'
import { printFindings } from '../reporter/terminal-reporter'
import { printSummary } from '../cli/display'
import type { OrvyenConfig } from '../types'

const DEFAULT_CONFIG: OrvyenConfig = {
  include: ['models/**/*.sql'],
  exclude: [],
  checks: {
    unused_model: true,
    missing_tests: true,
    circular_dependency: true,
    broken_ref: true,
    duplicate_logic: true,
    grain_misalignment: true,
    undocumented_model: true,
    god_model: true,
  },
  output: 'terminal',
  outputDir: '.orvyen',
}

export async function startInteractiveUI(): Promise<void> {
  // Import ASCII art functions
  const { printLargeBanner } = await import('../cli/ascii-art')

  // Display welcome banner
  printLargeBanner()
  console.log()


  // Step 1: Get project path
  const projectPrompt = await prompts({
    type: 'text',
    name: 'path',
    message: 'Enter path to your models directory (e.g., ./models):',
    initial: './models',
  })

  if (!projectPrompt.path) {
    console.log('\n❌ No path provided. Exiting.\n')
    return
  }

  const projectPath = path.resolve(projectPrompt.path)

  // Step 2: Select output format
  const formatPrompt = await prompts({
    type: 'select',
    name: 'format',
    message: 'Select output format:',
    choices: [
      { title: '▸ Terminal (colored table)', value: 'terminal' },
      { title: '▸ HTML (self-contained report)', value: 'html' },
      { title: '▸ JSON (machine-readable)', value: 'json' },
      { title: '▸ All Formats', value: 'all' },
    ],
    initial: 0,
  })

  if (formatPrompt.format === undefined) {
    console.log('\n❌ No format selected. Exiting.\n')
    return
  }

  const format = formatPrompt.format as OrvyenConfig['output']

  // Step 3: Confirm and run
  console.log('\n  ▸ Running audit...\n')

  try {
    const config: OrvyenConfig = {
      ...DEFAULT_CONFIG,
      output: format,
    }

    const result = await runAudit(config, projectPath)

    // Display results
    console.log(printFindings(result.findings, projectPath, true, 'detailed'))
    console.log('')

    // Handle critical findings
    const criticalCount = result.findings.filter((f) => f.severity === 'critical').length
    if (criticalCount > 0) {
      console.log('\n⚠️  Critical issues found. Exit code: 1')
      process.exit(1)
    }

    console.log('\n✅ Audit complete! Reports saved to: .orvyen/\n')
  } catch (error) {
    console.error('\n❌ Error during audit:')
    console.error(error instanceof Error ? error.message : String(error))
    console.log('')
    process.exit(1)
  }
}

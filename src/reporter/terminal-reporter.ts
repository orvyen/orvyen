import type { Finding } from '../types/finding';
import { TerminalRenderer } from './premium-terminal';

/**
 * Print findings using premium terminal renderer
 */
export function printFindings(
  findings: Finding[],
  projectPath: string = '.',
  useColor: boolean = !process.env.NO_COLOR,
  mode: 'detailed' | 'compact' | 'ci' = 'detailed'
): string {
  const noColor = !useColor;

  // Calculate context stats
  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const mediumCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;

  // Estimate architecture score (0-10)
  // Perfect = 10, each critical -= 3, high -= 1.5, medium -= 0.5, low -= 0.1
  let score = 10;
  score -= criticalCount * 3;
  score -= highCount * 1.5;
  score -= mediumCount * 0.5;
  score -= lowCount * 0.1;
  score = Math.max(0, Math.min(10, score));

  // Empty state
  if (findings.length === 0) {
    const renderer = new TerminalRenderer({
      mode,
      noColor,
      width: process.stdout.columns || 80,
    });

    const context = {
      modelsAnalyzed: 1,
      totalFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      archScore: 10,
      execTimeMs: 0,
      projectPath,
    };

    return `${renderer.render(context, [])}\n\n✅ All clear! Your SQL architecture is clean.\n`;
  }

  // Use premium renderer
  const width = process.stdout.columns || 80;
  const renderer = new TerminalRenderer({ mode, noColor, width });

  const context = {
    modelsAnalyzed: 1, // This would come from DAG context in real usage
    totalFindings: findings.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    archScore: score,
    execTimeMs: 0,
    projectPath,
  };

  return renderer.render(context, findings);
}

/**
 * Print detailed finding information
 */
export function printDetailedFinding(finding: Finding): string {
  let output = '';
  output += `\n${'='.repeat(60)}\n`;
  output += `Model: ${finding.model}\n`;
  output += `Type: ${finding.type}\n`;
  output += `Severity: ${finding.severity}\n`;
  if (finding.line) {
    output += `Line: ${finding.line}\n`;
  }
  output += `\nTitle: ${finding.title}\n`;
  output += `Description: ${finding.description}\n`;
  output += `Suggestion: ${finding.suggestion}\n`;
  output += `${'='.repeat(60)}\n`;
  return output;
}

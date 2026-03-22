/**
 * Premium terminal renderer for Orvyen
 * Outputs pixel-perfect, shareable CLI output
 */

import chalk from 'chalk';
import { Finding, Severity } from '../types';
import { RenderMode, RendererOptions, RenderContext } from './types';

export class TerminalRenderer {
  private mode: RenderMode;
  private noColor: boolean;
  private width: number;

  constructor(options: RendererOptions) {
    this.mode = options.mode;
    this.noColor = options.noColor;
    this.width = Math.min(options.width, 100);
  }

  /**
   * Render complete audit report
   */
  render(context: RenderContext, findings: Finding[]): string {
    const lines: string[] = [];

    lines.push(this.renderHeader(context));
    lines.push(''); // blank line

    if (this.mode !== 'ci') {
      lines.push(this.renderQuickStats(context));
      lines.push('');
      lines.push(this.renderArchScore(context));
      lines.push('');
    }

    lines.push(this.renderFindingsSection(context, findings));
    lines.push('');
    lines.push(this.renderSummary(context));

    return lines.join('\n');
  }

  /**
   * Header section with tool branding
   */
  private renderHeader(ctx: RenderContext): string {
    const pathShort = ctx.projectPath.length > 50 
      ? '...' + ctx.projectPath.slice(-47)
      : ctx.projectPath;

    const header = [
      ``,
      `${this.col('cyan', '🔍')} ${this.bold('ORVYEN — SQL Architecture Auditor')}`,
      `${this.col('dim', `Auditing ${pathShort} • ${ctx.modelsAnalyzed} models`)}`,
      ``,
    ];

    return header.join('\n');
  }

  /**
   * Quick scan stats (1 line compact)
   */
  private renderQuickStats(ctx: RenderContext): string {
    const statString = `${ctx.modelsAnalyzed} models • ${ctx.totalFindings} findings • ${(ctx.execTimeMs / 1000).toFixed(2)}s`;
    return `${this.col('cyan', '📊 Quick Scan')}\n   ${this.col('dim', statString)}`;
  }

  /**
   * Architecture score with visual bar
   */
  private renderArchScore(ctx: RenderContext): string {
    const score = Math.min(10, Math.max(0, ctx.archScore));
    const fillCount = Math.round(score);
    const emptyCount = 10 - fillCount;

    const bar = this.col('green', '█'.repeat(fillCount)) + 
                this.col('dim', '░'.repeat(emptyCount));

    const scoreText = score < 5 ? 'Needs significant work' :
                     score < 7 ? 'Could use improvement' :
                     score < 9 ? 'Good shape' : 'Excellent';

    return `${this.col('cyan', '🏗️  Architecture Score')}: ${this.bold(`${score.toFixed(1)}/10`)}\n   ${bar} ${scoreText}`;
  }

  /**
   * Findings grouped by severity with details
   */
  private renderFindingsSection(ctx: RenderContext, findings: Finding[]): string {
    const lines: string[] = [];
    const divider = '─'.repeat(this.width);

    const bySeverity = this.groupBySeverity(findings);

    // Render each severity level
    const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low'];
    
    for (const severity of severityOrder) {
      const severityFindings = bySeverity[severity] || [];
      if (severityFindings.length === 0) continue;

      lines.push(divider);
      lines.push('');
      lines.push(this.renderSeverityHeader(severity, severityFindings.length));
      lines.push('');

      // In compact mode, only show critical + high
      const toShow = (this.mode === 'compact' && severity === 'low') 
        ? [] 
        : (this.mode === 'compact' && severity === 'medium')
        ? []
        : severityFindings;

      if (toShow.length === 0 && this.mode === 'compact') {
        lines.push(`  ${this.col('dim', `(${severityFindings.length} ${severity.toUpperCase()} findings hidden in compact mode)`)}  `);
      } else {
        toShow.forEach((finding, idx) => {
          lines.push(this.renderFinding(finding));
          if (idx < toShow.length - 1) lines.push('');
        });
      }
    }

    lines.push('');
    return lines.join('\n');
  }

  /**
   * Severity section header
   */
  private renderSeverityHeader(severity: Severity, count: number): string {
    const icons: Record<Severity, string> = {
      critical: this.noColor ? '[!]' : '🔴',
      high: this.noColor ? '[▲]' : '🟠',
      medium: this.noColor ? '[●]' : '🟡',
      low: this.noColor ? '[○]' : '⚪',
    };

    const colors: Record<Severity, (s: string) => string> = {
      critical: (s) => this.col('red', s),
      high: (s) => this.col('yellow', s),
      medium: (s) => this.col('yellow', s),
      low: (s) => this.col('dim', s),
    };

    const label = `${icons[severity]} ${severity.toUpperCase()} (${count})`;
    return colors[severity](label);
  }

  /**
   * Individual finding card
   */
  private renderFinding(f: Finding): string {
    const icon = this.getIcon(f.severity);
    const title = this.bold(`${f.model}`);
    const issueLabel = this.col('dim', 'Issue:');
    const descLabel = this.col('dim', 'Line:');
    const fixLabel = this.col('dim', 'Fix:');

    const lines = [
      `  ${icon} ${title}`,
      `     ${issueLabel}  ${f.title}`,
    ];

    if (f.line) {
      lines.push(`     ${descLabel}   ${f.line}`);
    }

    lines.push(`     ${fixLabel}   ${f.suggestion}`);

    return lines.join('\n');
  }

  /**
   * Bottom summary section
   */
  private renderSummary(ctx: RenderContext): string {
    const divider = '─'.repeat(this.width);
    const cleanModels = Math.ceil(ctx.modelsAnalyzed * (10 - ctx.archScore) / 10);
    const percentClean = Math.round((cleanModels / ctx.modelsAnalyzed) * 100);

    const statusStr = ctx.criticalCount > 0 ? '❌ Issues found (fix critical/high before merge)' 
                    : ctx.highCount > 0 ? '⚠️  High-priority findings'
                    : ctx.mediumCount > 0 ? '✓ Low-priority items'
                    : '✅ All clear';

    const lines = [
      divider,
      '',
      `${this.col('cyan', '📋 Summary')}`,
      '',
      `Status:          ${statusStr}`,
      `Models clean:    ${cleanModels} / ${ctx.modelsAnalyzed} (${percentClean}%)`,
    ];

    if (ctx.criticalCount > 0) {
      lines.push(`Blocker:         ${ctx.criticalCount} critical ${ctx.criticalCount === 1 ? 'issue' : 'issues'} must be resolved`);
    }

    lines.push(`Execution time:  ${(ctx.execTimeMs).toFixed(0)}ms`);

    return lines.join('\n');
  }

  /**
   * Utility: Get emoji/symbol for severity
   */
  private getIcon(severity: Severity): string {
    if (this.noColor) {
      return {
        critical: '[!]',
        high: '[▲]',
        medium: '[●]',
        low: '[○]',
      }[severity];
    }

    return {
      critical: '❌',
      high: '⚠️ ',
      medium: '💡',
      low: '○ ',
    }[severity];
  }

  /**
   * Utility: Apply color (respects NO_COLOR)
   */
  private col(color: string, text: string): string {
    if (this.noColor) return text;

    const colorMap: Record<string, (s: string) => string> = {
      red: (s) => chalk.red(s),
      cyan: (s) => chalk.cyan(s),
      yellow: (s) => chalk.yellow(s),
      green: (s) => chalk.green(s),
      dim: (s) => chalk.dim(s),
    };

    return (colorMap[color] || ((s) => s))(text);
  }

  /**
   * Utility: Apply bold (respects NO_COLOR)
   */
  private bold(text: string): string {
    return this.noColor ? text : chalk.bold(text);
  }

  /**
   * Group findings by severity
   */
  private groupBySeverity(findings: Finding[]): Record<Severity, Finding[]> {
    return {
      critical: findings.filter((f) => f.severity === 'critical'),
      high: findings.filter((f) => f.severity === 'high'),
      medium: findings.filter((f) => f.severity === 'medium'),
      low: findings.filter((f) => f.severity === 'low'),
    };
  }
}

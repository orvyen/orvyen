/**
 * HTML template for Orvyen premium report
 * Self-contained, dark mode, no external dependencies
 */

import { Finding } from '../types';

export interface ReportData {
  projectPath: string;
  projectName: string;
  modelsAnalyzed: number;
  totalFindings: number;
  timestamp: string;
  executionTimeMs: number;
  findings: Finding[];
  archScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

/**
 * Generate complete self-contained HTML report
 */
export function generateReportHTML(data: ReportData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Orvyen Audit Report - ${escapeHtml(data.projectName)}</title>
  <style>
    ${getEmbeddedCSS()}
  </style>
</head>
<body>
  <div class="container">
    ${renderHeader(data)}
    ${renderArchScoreCard(data)}
    ${renderSeverityBreakdown(data)}
    ${renderFindings(data)}
    ${renderModelHealth(data)}
    ${renderFooter(data)}
  </div>
</body>
</html>`;
}

/**
 * Header section with project info and scan stats
 */
function renderHeader(data: ReportData): string {
  return `
    <header class="header">
      <div class="header-content">
        <div class="header-main">
          <h1 class="title">SQL Architecture Audit</h1>
          <p class="subtitle">${escapeHtml(data.projectPath)}</p>
        </div>
        
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">${data.modelsAnalyzed}</span>
            <span class="stat-label">Models</span>
          </div>
          <div class="stat">
            <span class="stat-value">${data.totalFindings}</span>
            <span class="stat-label">Findings</span>
          </div>
          <div class="stat">
            <span class="stat-value">${(data.executionTimeMs / 1000).toFixed(2)}s</span>
            <span class="stat-label">Time</span>
          </div>
        </div>
      </div>
      
      <div class="header-meta">
        <span class="meta-item">Generated ${data.timestamp}</span>
      </div>
    </header>
  `;
}

/**
 * Architecture score card
 */
function renderArchScoreCard(data: ReportData): string {
  const score = Math.min(10, Math.max(0, data.archScore));
  const fillPercent = (score / 10) * 100;
  const status = score < 3 ? 'Critical' : 
                 score < 5 ? 'Needs Work' :
                 score < 7 ? 'Good Shape' :
                 score < 9 ? 'Excellent' : 'Perfect';
  
  return `
    <section class="arch-score">
      <div class="arch-score-content">
        <div class="arch-main">
          <div class="arch-number">${score.toFixed(1)}</div>
          <div class="arch-label">/ 10</div>
        </div>
        
        <div class="arch-details">
          <h2 class="arch-title">Architecture Score</h2>
          <p class="arch-status">${status}</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${fillPercent}%; background-color: ${getScoreColor(score)};"></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Severity breakdown cards
 */
function renderSeverityBreakdown(data: ReportData): string {
  return `
    <section class="severity-breakdown">
      <div class="breakdown-grid">
        <div class="breakdown-card critical">
          <div class="breakdown-icon">🔴</div>
          <div class="breakdown-count">${data.criticalCount}</div>
          <div class="breakdown-label">Critical</div>
        </div>
        
        <div class="breakdown-card high">
          <div class="breakdown-icon">🟠</div>
          <div class="breakdown-count">${data.highCount}</div>
          <div class="breakdown-label">High</div>
        </div>
        
        <div class="breakdown-card medium">
          <div class="breakdown-icon">🟡</div>
          <div class="breakdown-count">${data.mediumCount}</div>
          <div class="breakdown-label">Medium</div>
        </div>
        
        <div class="breakdown-card low">
          <div class="breakdown-icon">⚪</div>
          <div class="breakdown-count">${data.lowCount}</div>
          <div class="breakdown-label">Low</div>
        </div>
      </div>
    </section>
  `;
}

/**
 * All findings grouped by severity
 */
function renderFindings(data: ReportData): string {
  const bySeverity = groupBySeverity(data.findings);
  const severityOrder: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  
  let html = '<section class="findings-section">';
  
  for (const severity of severityOrder) {
    const findings = bySeverity[severity] || [];
    if (findings.length === 0) continue;
    
    const icon = getSeverityIcon(severity);
    const colorClass = severity;
    const label = severity.charAt(0).toUpperCase() + severity.slice(1);
    
    html += `
      <div class="findings-group">
        <h2 class="findings-header ${colorClass}">
          <span class="severity-icon">${icon}</span>
          ${label} (${findings.length})
        </h2>
        
        <div class="findings-list">
    `;
    
    for (const finding of findings) {
      html += renderFindingCard(finding, severity);
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += '</section>';
  return html;
}

/**
 * Individual finding card
 */
function renderFindingCard(finding: Finding, severity: string): string {
  return `
    <div class="finding-card ${severity}">
      <div class="finding-header">
        <h3 class="finding-title">${escapeHtml(finding.model)}</h3>
        <span class="finding-type">${escapeHtml(finding.type)}</span>
      </div>
      
      <p class="finding-description">${escapeHtml(finding.description)}</p>
      
      <div class="finding-suggestion">
        <strong>Fix:</strong> ${escapeHtml(finding.suggestion)}
      </div>
      
      ${finding.line ? `<div class="finding-meta">Line ${finding.line}</div>` : ''}
    </div>
  `;
}

/**
 * Model health summary
 */
function renderModelHealth(data: ReportData): string {
  const cleanCount = Math.max(0, data.modelsAnalyzed - Math.ceil(data.totalFindings / 5));
  const cleanPercent = data.modelsAnalyzed > 0 ? Math.round((cleanCount / data.modelsAnalyzed) * 100) : 0;
  
  return `
    <section class="model-health">
      <h2 class="section-title">Model Summary</h2>
      
      <div class="health-grid">
        <div class="health-card">
          <div class="health-label">Total Models Analyzed</div>
          <div class="health-value">${data.modelsAnalyzed}</div>
        </div>
        
        <div class="health-card">
          <div class="health-label">Clean Models</div>
          <div class="health-value">${cleanCount} <span class="health-percent">(${cleanPercent}%)</span></div>
        </div>
        
        <div class="health-card">
          <div class="health-label">With Issues</div>
          <div class="health-value">${data.totalFindings > 0 ? Math.ceil(data.totalFindings / 2) : 0}</div>
        </div>
        
        <div class="health-card">
          <div class="health-label">Avg. Issues/Model</div>
          <div class="health-value">${(data.totalFindings / Math.max(1, data.modelsAnalyzed)).toFixed(1)}</div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Footer with metadata
 */
function renderFooter(data: ReportData): string {
  return `
    <footer class="footer">
      <p>Generated by <strong>Orvyen</strong> — SQL Architecture Auditor</p>
      <p class="footer-meta">${escapeHtml(data.timestamp)}</p>
    </footer>
  `;
}

/**
 * Embedded CSS (all styles self-contained)
 */
function getEmbeddedCSS(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background-color: #0f1117;
      color: #e6edf3;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    
    /* Header */
    .header {
      margin-bottom: 32px;
      border-bottom: 1px solid #30363d;
      padding-bottom: 24px;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    
    .title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #e6edf3;
    }
    
    .subtitle {
      font-size: 14px;
      color: #8b949e;
      font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace;
    }
    
    .header-stats {
      display: flex;
      gap: 32px;
      align-items: center;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #58a6ff;
    }
    
    .stat-label {
      font-size: 12px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }
    
    .header-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #6e7681;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
    }
    
    /* Architecture Score */
    .arch-score {
      background: linear-gradient(135deg, #161b22 0%, #1c2128 100%);
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 32px;
      margin-bottom: 32px;
    }
    
    .arch-score-content {
      display: flex;
      align-items: center;
      gap: 32px;
    }
    
    .arch-main {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    
    .arch-number {
      font-size: 56px;
      font-weight: 700;
      color: #58a6ff;
    }
    
    .arch-label {
      font-size: 20px;
      color: #8b949e;
    }
    
    .arch-details {
      flex: 1;
    }
    
    .arch-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .arch-status {
      font-size: 14px;
      color: #8b949e;
      margin-bottom: 12px;
    }
    
    .progress-bar {
      height: 8px;
      background: #21262d;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    /* Severity Breakdown */
    .severity-breakdown {
      margin-bottom: 32px;
    }
    
    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
    }
    
    .breakdown-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    
    .breakdown-card.critical {
      border-color: #f85149;
      border-left: 3px solid #f85149;
    }
    
    .breakdown-card.high {
      border-color: #d29922;
      border-left: 3px solid #d29922;
    }
    
    .breakdown-card.medium {
      border-color: #e3b341;
      border-left: 3px solid #e3b341;
    }
    
    .breakdown-card.low {
      border-color: #238636;
      border-left: 3px solid #238636;
    }
    
    .breakdown-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .breakdown-count {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .breakdown-label {
      font-size: 12px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Findings */
    .findings-section {
      margin-bottom: 32px;
    }
    
    .findings-group {
      margin-bottom: 24px;
    }
    
    .findings-group:last-child {
      margin-bottom: 0;
    }
    
    .findings-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      padding: 12px 16px;
      border-radius: 6px;
      border-left: 3px solid;
    }
    
    .findings-header.critical {
      color: #f85149;
      border-color: #f85149;
      background: rgba(248, 81, 73, 0.05);
    }
    
    .findings-header.high {
      color: #d29922;
      border-color: #d29922;
      background: rgba(210, 153, 34, 0.05);
    }
    
    .findings-header.medium {
      color: #e3b341;
      border-color: #e3b341;
      background: rgba(227, 179, 65, 0.05);
    }
    
    .findings-header.low {
      color: #238636;
      border-color: #238636;
      background: rgba(35, 134, 54, 0.05);
    }
    
    .severity-icon {
      display: flex;
    }
    
    .findings-list {
      display: grid;
      gap: 12px;
    }
    
    .finding-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 16px;
      border-left: 3px solid;
    }
    
    .finding-card.critical {
      border-left-color: #f85149;
    }
    
    .finding-card.high {
      border-left-color: #d29922;
    }
    
    .finding-card.medium {
      border-left-color: #e3b341;
    }
    
    .finding-card.low {
      border-left-color: #238636;
    }
    
    .finding-card:hover {
      background: #1c2128;
      border-color: #58a6ff;
    }
    
    .finding-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .finding-title {
      font-size: 15px;
      font-weight: 600;
      color: #e6edf3;
    }
    
    .finding-type {
      font-size: 11px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #21262d;
      padding: 2px 8px;
      border-radius: 3px;
    }
    
    .finding-description {
      font-size: 13px;
      color: #8b949e;
      margin-bottom: 8px;
      line-height: 1.5;
    }
    
    .finding-suggestion {
      font-size: 12px;
      color: #7ee787;
      padding: 8px;
      background: rgba(35, 134, 54, 0.05);
      border-radius: 4px;
      border-left: 2px solid #238636;
    }
    
    .finding-meta {
      font-size: 11px;
      color: #6e7681;
      margin-top: 8px;
    }
    
    /* Model Health */
    .model-health {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    
    .health-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
    }
    
    .health-card {
      background: #0f1117;
      border: 1px solid #21262d;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }
    
    .health-card:hover {
      border-color: #30363d;
    }
    
    .health-label {
      font-size: 11px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .health-value {
      font-size: 20px;
      font-weight: 700;
      color: #58a6ff;
    }
    
    .health-percent {
      font-size: 12px;
      color: #8b949e;
      font-weight: 400;
    }
    
    /* Footer */
    .footer {
      border-top: 1px solid #30363d;
      padding-top: 24px;
      text-align: center;
      font-size: 12px;
      color: #6e7681;
    }
    
    .footer-meta {
      margin-top: 8px;
      font-size: 11px;
      color: #6e7681;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .container {
        padding: 16px;
      }
      
      .header-content {
        flex-direction: column;
      }
      
      .header-stats {
        width: 100%;
        justify-content: space-around;
      }
      
      .arch-score-content {
        flex-direction: column;
        gap: 16px;
      }
      
      .breakdown-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .health-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;
}

/**
 * Helper: Get color for score
 */
function getScoreColor(score: number): string {
  if (score < 3) return '#f85149';    // Red
  if (score < 5) return '#d29922';    // Orange
  if (score < 7) return '#e3b341';    // Yellow
  if (score < 9) return '#238636';    // Green
  return '#58a6ff';                   // Blue (excellent)
}

/**
 * Helper: Safe HTML escape
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Helper: Group findings by severity
 */
function groupBySeverity(findings: Finding[]): Record<string, Finding[]> {
  return {
    critical: findings.filter((f) => f.severity === 'critical'),
    high: findings.filter((f) => f.severity === 'high'),
    medium: findings.filter((f) => f.severity === 'medium'),
    low: findings.filter((f) => f.severity === 'low'),
  };
}

/**
 * Helper: Get icon for severity
 */
function getSeverityIcon(severity: string): string {
  const icons: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '⚪',
  };
  return icons[severity] || '●';
}

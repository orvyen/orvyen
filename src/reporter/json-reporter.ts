import fs from "fs/promises";
import path from "path";
import type { Finding } from "../types/finding";

export interface JsonReportFormat {
  version: "1.0";
  timestamp: string;
  project: {
    path: string;
    modelsAnalyzed: number;
  };
  executionTime: number;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  findings: Finding[];
}

/**
 * Generate a JSON report from findings (useful for CI/CD)
 */
export async function generateJsonReport(
  findings: Finding[],
  projectDir: string,
  modelCount: number,
  executionTime: number,
  outputPath: string
): Promise<void> {
  const report: JsonReportFormat = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    project: {
      path: projectDir,
      modelsAnalyzed: modelCount,
    },
    executionTime,
    summary: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
    },
    findings,
  };

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write to file with nice formatting
  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), "utf-8");
}

/**
 * Parse and filter JSON report for CI integration
 */
export function parseJsonReport(json: string): JsonReportFormat {
  return JSON.parse(json) as JsonReportFormat;
}

/**
 * Check if report has critical findings (fail CI)
 */
export function hasCriticalFindings(report: JsonReportFormat): boolean {
  return report.summary.critical > 0;
}

/**
 * Generate a summary string from report
 */
export function summarizeReport(report: JsonReportFormat): string {
  const { summary } = report;
  return `
Orvyen Report Summary:
  📊 Models Analyzed: ${report.project.modelsAnalyzed}
  🔴 Critical: ${summary.critical}
  🟠 High: ${summary.high}
  🟡 Medium: ${summary.medium}
  🟢 Low: ${summary.low}
  📈 Total: ${summary.total}
  ⏱️  Time: ${(report.executionTime / 1000).toFixed(2)}s
`.trim();
}

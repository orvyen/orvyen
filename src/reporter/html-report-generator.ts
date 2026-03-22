/**
 * Generate and save HTML audit report
 * Creates a self-contained, offline-friendly HTML file
 */

import fs from 'fs/promises';
import path from 'path';
import { Finding } from '../types';
import { generateReportHTML } from './html-template';

export interface ReportInput {
  findings: Finding[];
  modelCount: number;
  projectDir: string;
  timestamp: string;
  executionTime: number;
}

/**
 * Generate HTML report and save to disk
 */
export async function generateHtmlReport(
  input: ReportInput,
  outputPath: string
): Promise<void> {
  // Calculate metrics
  const criticalCount = input.findings.filter((f) => f.severity === 'critical').length;
  const highCount = input.findings.filter((f) => f.severity === 'high').length;
  const mediumCount = input.findings.filter((f) => f.severity === 'medium').length;
  const lowCount = input.findings.filter((f) => f.severity === 'low').length;

  // Calculate architecture score
  let score = 10;
  score -= criticalCount * 3;
  score -= highCount * 1.5;
  score -= mediumCount * 0.5;
  score -= lowCount * 0.1;
  score = Math.max(0, Math.min(10, score));

  // Extract project name from path
  const projectName = path.basename(input.projectDir) || 'SQL Project';

  // Prepare data for template
  const reportData = {
    projectPath: input.projectDir,
    projectName,
    modelsAnalyzed: input.modelCount,
    totalFindings: input.findings.length,
    timestamp: input.timestamp,
    executionTimeMs: input.executionTime,
    findings: input.findings,
    archScore: score,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  };

  // Generate HTML
  const html = generateReportHTML(reportData);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Write file
  await fs.writeFile(outputPath, html, 'utf-8');

  console.log(`✅ HTML report generated: ${outputPath}`);
}

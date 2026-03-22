/**
 * Premium HTML Report Generator
 * Self-contained, offline-friendly, dark mode
 * Uses html-template.ts for layout and styling
 */

import fs from 'fs/promises';
import path from 'path';
import type { Finding } from '../types/finding';
import { generateReportHTML } from './html-template';

interface ReportData {
  findings: Finding[];
  modelCount: number;
  projectDir: string;
  timestamp: string;
  executionTime: number;
}

/**
 * Generate and save HTML report
 */
export async function generateHtmlReport(
  data: ReportData,
  outputPath: string
): Promise<void> {
  // Calculate metrics
  const criticalCount = data.findings.filter((f) => f.severity === 'critical').length;
  const highCount = data.findings.filter((f) => f.severity === 'high').length;
  const mediumCount = data.findings.filter((f) => f.severity === 'medium').length;
  const lowCount = data.findings.filter((f) => f.severity === 'low').length;

  // Calculate architecture score
  let score = 10;
  score -= criticalCount * 3;
  score -= highCount * 1.5;
  score -= mediumCount * 0.5;
  score -= lowCount * 0.1;
  score = Math.max(0, Math.min(10, score));

  // Extract project name
  const projectName = path.basename(data.projectDir) || 'SQL Project';

  // Generate HTML using template
  const html = generateReportHTML({
    projectPath: data.projectDir,
    projectName,
    modelsAnalyzed: data.modelCount,
    totalFindings: data.findings.length,
    timestamp: data.timestamp,
    executionTimeMs: data.executionTime,
    findings: data.findings,
    archScore: score,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
  });
  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(outputPath, html, 'utf-8');
}


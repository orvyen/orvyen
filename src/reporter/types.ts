/**
 * Terminal rendering types and interfaces
 */

export type RenderMode = 'detailed' | 'compact' | 'ci';

export interface RendererOptions {
  mode: RenderMode;
  noColor: boolean;
  width: number;
}

export interface RenderedSection {
  title: string;
  content: string;
}

export interface RenderContext {
  modelsAnalyzed: number;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  archScore: number;
  execTimeMs: number;
  projectPath: string;
}

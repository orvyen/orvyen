import type { FindingType, Severity } from "./finding";

export interface OrvyenConfig {
  include: string[];
  exclude: string[];
  checks: Partial<Record<FindingType, boolean | { severity: Severity }>>;
  output: "terminal" | "html" | "json" | "all";
  outputDir: string;
}

export interface ResolvedConfig extends OrvyenConfig {
  // Resolved absolute paths
  projectRoot: string;
  workingDir: string;
}

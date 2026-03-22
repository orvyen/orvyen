export type Severity = "critical" | "high" | "medium" | "low";

export type FindingType =
  | "unused_model"
  | "missing_tests"
  | "duplicate_logic"
  | "broken_ref"
  | "grain_misalignment"
  | "circular_dependency"
  | "undocumented_model"
  | "god_model";

export interface Finding {
  id: string;
  type: FindingType;
  severity: Severity;
  model: string;
  title: string;
  description: string;
  suggestion: string;
  line?: number;
}

// Severity mapping for default values
export const DEFAULT_SEVERITY: Record<FindingType, Severity> = {
  circular_dependency: "critical",
  broken_ref: "critical",
  grain_misalignment: "high",
  duplicate_logic: "high",
  missing_tests: "high",
  god_model: "medium",
  unused_model: "low",
  undocumented_model: "low",
};

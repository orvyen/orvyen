import type { Finding } from "../types/finding";
import type { DagNode } from "../types/model";

/**
 * Check for models missing dbt tests
 */
export function checkMissingTests(nodes: Map<string, DagNode>): Finding[] {
  const findings: Finding[] = [];

  for (const [modelName, node] of nodes.entries()) {
    // Skip ephemeral models and intermediate models (often testing isn't needed)
    if (node.model.materialization === "ephemeral") {
      continue;
    }

    // Check if model has tests
    if (node.model.tests.length === 0) {
      const finding: Finding = {
        id: `missing-tests-${modelName}`,
        type: "missing_tests",
        severity: "high",
        model: modelName,
        title: `Missing tests: ${modelName}`,
        description: `Model '${modelName}' has no dbt tests attached. No safety net to catch data quality issues.`,
        suggestion: `Add at least one test to this model. Consider tests like: unique, not_null, or custom tests for business logic.`,
      };

      findings.push(finding);
    }
  }

  return findings;
}

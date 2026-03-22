import type { Finding } from "../types/finding";
import type { DagNode } from "../types/model";

/**
 * Check for "god models" - models that do too much
 * Detected by: high complexity via JOIN count, case statements, etc.
 */
export function checkGodModels(nodes: Map<string, DagNode>): Finding[] {
  const findings: Finding[] = [];

  for (const [modelName, node] of nodes.entries()) {
    // Simple heuristic: if SQL is very long and/or has many JOINs
    const joinCount = (node.model.sql.match(/JOIN/gi) || []).length;
    const caseCount = (node.model.sql.match(/CASE\s+WHEN/gi) || []).length;

    // Threshold: more than 3 joins + many case statements
    if (joinCount > 3 && caseCount > 2) {
      const finding: Finding = {
        id: `god-model-${modelName}`,
        type: "god_model",
        severity: "medium",
        model: modelName,
        title: `God model candidate: ${modelName}`,
        description: `Model '${modelName}' appears to do too much (${joinCount} JOINs, ${caseCount} CASE statements). High complexity may indicate poor separation of concerns.`,
        suggestion: `Consider breaking this model into smaller, single-purpose models. This improves testability, reusability, and maintainability.`,
      };

      findings.push(finding);
    }
  }

  return findings;
}

import type { Finding } from "../types/finding";
import type { DagNode } from "../types/model";

/**
 * Check for unused models (models with no downstream dependencies)
 */
export function checkUnusedModels(nodes: Map<string, DagNode>): Finding[] {
  const findings: Finding[] = [];

  for (const [modelName, node] of nodes.entries()) {
    // A model is unused if it has no downstream dependents
    if (node.downstream.length === 0) {
      const finding: Finding = {
        id: `unused-${modelName}`,
        type: "unused_model",
        severity: "low",
        model: modelName,
        title: `Unused model: ${modelName}`,
        description: `Model '${modelName}' is not referenced by any other model. It may be dead code.`,
        suggestion: `Review if this model is still needed. If not, consider removing it to reduce maintenance burden.`,
        line: undefined,
      };

      findings.push(finding);
    }
  }

  return findings;
}

import type { Finding } from "../types/finding";
import type { DagNode } from "../types/model";

/**
 * Check for undocumented models
 */
export function checkUndocumentedModels(nodes: Map<string, DagNode>): Finding[] {
  const findings: Finding[] = [];

  for (const [modelName, node] of nodes.entries()) {
    if (!node.model.description || node.model.description.trim().length === 0) {
      const finding: Finding = {
        id: `undoc-${modelName}`,
        type: "undocumented_model",
        severity: "low",
        model: modelName,
        title: `Undocumented model: ${modelName}`,
        description: `Model '${modelName}' is missing a description in schema.yml.`,
        suggestion: `Add a description in schema.yml to document the purpose and business logic of this model.`,
      };

      findings.push(finding);
    }
  }

  return findings;
}

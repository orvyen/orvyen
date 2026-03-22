import type { Finding } from "../types/finding";
import type { DagNode } from "../types/model";

/**
 * Check for broken refs (references to models that don't exist)
 */
export function checkBrokenRefs(nodes: Map<string, DagNode>): Finding[] {
  const findings: Finding[] = [];
  const modelNames = new Set(nodes.keys());

  for (const [modelName, node] of nodes.entries()) {
    // Check each ref
    for (const ref of node.model.refs) {
      if (!modelNames.has(ref)) {
        const lineNum = findRefLine(node.model.sql, ref);

        const finding: Finding = {
          id: `broken-ref-${modelName}-${ref}`,
          type: "broken_ref",
          severity: "critical",
          model: modelName,
          title: `Broken ref: model '${ref}' does not exist`,
          description: `Model '${modelName}' references a model named '${ref}' which does not exist in the project.`,
          suggestion: `Check the spelling of the reference or ensure the model exists. Update the ref() call to point to the correct model name.`,
          line: lineNum,
        };

        findings.push(finding);
      }
    }
  }

  return findings;
}

/**
 * Find line number where ref appears in SQL
 */
function findRefLine(sql: string, refName: string): number | undefined {
  const lines = sql.split("\n");
  const refPattern = new RegExp(`ref\\s*\\(\\s*['"]${refName}['"]`, "i");

  for (let i = 0; i < lines.length; i++) {
    if (refPattern.test(lines[i])) {
      return i + 1; // 1-indexed line numbers
    }
  }

  return undefined;
}

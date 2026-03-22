import type { Finding } from "../types/finding";
import type { DagNode } from "../types/model";

/**
 * Check for circular dependencies in the DAG
 */
export function checkCircularDeps(nodes: Map<string, DagNode>): Finding[] {
  const findings: Finding[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  const dfs = (nodeName: string, path: string[]): void => {
    if (recursionStack.has(nodeName)) {
      // Found a cycle
      const cycleStart = path.indexOf(nodeName);
      if (cycleStart !== -1) {
        const cycle = [...path.slice(cycleStart), nodeName];
        cycles.push(cycle);
      }
      return;
    }

    if (visited.has(nodeName)) {
      return;
    }

    visited.add(nodeName);
    recursionStack.add(nodeName);

    const node = nodes.get(nodeName);
    if (!node) {
      recursionStack.delete(nodeName);
      return;
    }

    for (const downstream of node.downstream) {
      dfs(downstream, [...path, downstream]);
    }

    recursionStack.delete(nodeName);
  };

  // Start DFS from all nodes
  for (const nodeName of nodes.keys()) {
    if (!visited.has(nodeName)) {
      dfs(nodeName, [nodeName]);
    }
  }

  // Convert cycles to findings
  for (const cycle of cycles) {
    const cyclePath = cycle.join(" → ");

    for (const modelName of cycle) {
      const finding: Finding = {
        id: `circular-${cycle.join("-")}`,
        type: "circular_dependency",
        severity: "critical",
        model: modelName,
        title: `Circular dependency detected`,
        description: `Model '${modelName}' is part of a circular dependency: ${cyclePath}`,
        suggestion: `Break the cycle by restructuring your models. Consider creating an intermediate ephemeral model or refactoring shared logic.`,
      };

      findings.push(finding);
    }
  }

  return findings;
}

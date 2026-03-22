import type { DbtModel, DagNode, DagEdge } from "../types/model";

/**
 * Builds a Directed Acyclic Graph (DAG) from parsed models
 */
export class DagBuilder {
  private nodes: Map<string, DagNode> = new Map();
  private edges: DagEdge[] = [];

  /**
   * Initialize DAG from models
   */
  constructor(models: Map<string, DbtModel>) {
    // Create nodes
    for (const model of models.values()) {
      this.nodes.set(model.name, {
        model,
        upstream: [],
        downstream: [],
        depth: 0,
      });
    }

    // Build edges
    for (const model of models.values()) {
      // Process refs (direct model dependencies)
      for (const refName of model.refs) {
        if (models.has(refName)) {
          this.edges.push({
            from: refName,
            to: model.name,
            type: "ref",
          });
        } else {
          // Missing ref — will be flagged by broken-refs check
          this.edges.push({
            from: refName,
            to: model.name,
            type: "ref",
          });
        }
      }

      // Sources don't create upstream deps in our DAG
      // They're just noted as external tables
    }

    // Build adjacency lists
    for (const edge of this.edges) {
      const toNode = this.nodes.get(edge.to);
      const fromNode = this.nodes.get(edge.from);

      if (toNode) {
        if (!toNode.upstream.includes(edge.from)) {
          toNode.upstream.push(edge.from);
        }
      }

      if (fromNode) {
        if (!fromNode.downstream.includes(edge.to)) {
          fromNode.downstream.push(edge.to);
        }
      }
    }

    // Calculate depths
    this.calculateDepths();
  }

  /**
   * Calculate depth of each node (max distance from root)
   */
  private calculateDepths(): void {
    const visited = new Set<string>();

    const visit = (nodeName: string, depth: number): void => {
      const node = this.nodes.get(nodeName);
      if (!node) return;

      if (visited.has(nodeName)) {
        // Already calculated
        return;
      }

      // First visit all upstreams
      for (const upstream of node.upstream) {
        if (!visited.has(upstream)) {
          visit(upstream, depth - 1);
        }
      }

      // Then update this node's depth
      let maxUpstreamDepth = 0;
      for (const upstream of node.upstream) {
        const upstreamNode = this.nodes.get(upstream);
        if (upstreamNode && upstreamNode.depth >= maxUpstreamDepth) {
          maxUpstreamDepth = upstreamNode.depth + 1;
        }
      }

      node.depth = Math.max(node.depth, maxUpstreamDepth);
      visited.add(nodeName);
    };

    for (const nodeName of this.nodes.keys()) {
      visit(nodeName, 0);
    }
  }

  /**
   * Get all nodes
   */
  getNodes(): Map<string, DagNode> {
    return this.nodes;
  }

  /**
   * Get all edges
   */
  getEdges(): DagEdge[] {
    return this.edges;
  }

  /**
   * Get a specific node
   */
  getNode(modelName: string): DagNode | undefined {
    return this.nodes.get(modelName);
  }

  /**
   * Check for cycles (should be none in valid dbt)
   */
  findCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeName: string, path: string[]): void => {
      visited.add(nodeName);
      recursionStack.add(nodeName);

      const node = this.nodes.get(nodeName);
      if (!node) return;

      for (const downstream of node.downstream) {
        if (!visited.has(downstream)) {
          dfs(downstream, [...path, downstream]);
        } else if (recursionStack.has(downstream)) {
          // Found a cycle
          const cycleStart = path.indexOf(downstream);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), downstream]);
          }
        }
      }

      recursionStack.delete(nodeName);
    };

    for (const nodeName of this.nodes.keys()) {
      if (!visited.has(nodeName)) {
        dfs(nodeName, [nodeName]);
      }
    }

    return cycles;
  }

  /**
   * Get all models that depend on a given model (transitive)
   */
  getDependents(modelName: string): Set<string> {
    const dependents = new Set<string>();
    const visited = new Set<string>();

    const traverse = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const node = this.nodes.get(name);
      if (!node) return;

      for (const downstream of node.downstream) {
        dependents.add(downstream);
        traverse(downstream);
      }
    };

    traverse(modelName);
    return dependents;
  }

  /**
   * Get all dependencies of a given model (transitive)
   */
  getDependencies(modelName: string): Set<string> {
    const dependencies = new Set<string>();
    const visited = new Set<string>();

    const traverse = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);

      const node = this.nodes.get(name);
      if (!node) return;

      for (const upstream of node.upstream) {
        dependencies.add(upstream);
        traverse(upstream);
      }
    };

    traverse(modelName);
    return dependencies;
  }
}

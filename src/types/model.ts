export type Materialization =
  | "table"
  | "view"
  | "incremental"
  | "ephemeral"
  | "unknown";

export interface DbtModel {
  name: string;
  path: string;
  sql: string;
  refs: string[];
  sources: string[];
  tests: string[];
  description?: string;
  tags: string[];
  materialization: Materialization;
}

export interface DagNode {
  model: DbtModel;
  upstream: string[]; // models that this depends on
  downstream: string[]; // models that depend on this
  depth: number; // max distance from root
}

export interface DagEdge {
  from: string; // upstream model
  to: string; // downstream model
  type: "ref" | "source";
}

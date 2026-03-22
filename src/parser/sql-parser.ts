import fs from "fs/promises";
import path from "path";
import type { DbtModel } from "../types/model";

/**
 * Parses a SQL file to extract model metadata
 * Handles dbt-specific syntax: {{ ref() }}, {{ source() }}
 */
export async function parseSqlFile(filePath: string): Promise<DbtModel> {
  const sql = await fs.readFile(filePath, "utf-8");
  const fileName = path.basename(filePath, ".sql");

  // Extract refs: {{ ref('model_name') }}
  const refs = extractPattern(sql, /\{\{\s*ref\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g);

  // Extract sources: {{ source('source_name', 'table_name') }}
  const sources = extractPattern(
    sql,
    /\{\{\s*source\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)\s*\}\}/g,
    (match: RegExpExecArray) => `${match[1]}.${match[2]}`
  );

  // Detect materialization
  const materialization = detectMaterialization(sql);

  return {
    name: fileName,
    path: filePath,
    sql,
    refs,
    sources,
    tests: [], // Will be populated by schema parser
    description: undefined,
    tags: [],
    materialization,
  };
}

/**
 * Extract all pattern matches from text
 */
function extractPattern(
  text: string,
  regex: RegExp,
  transform?: (match: RegExpExecArray) => string
): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  // Reset regex global state
  regex.lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const value = transform ? transform(match) : match[1];
    if (value && !matches.includes(value)) {
      matches.push(value);
    }
  }

  return matches;
}

/**
 * Detect dbt materialization type from SQL config
 */
function detectMaterialization(sql: string): DbtModel["materialization"] {
  // Look for config block: {{ config(...) }}
  const configMatch = sql.match(
    /\{\{\s*config\s*\(\s*(?:.*?\n)*?\s*materialized\s*=\s*['"]([^'"]+)['"]/i
  );
  if (configMatch) {
    const mat = configMatch[1].toLowerCase();
    if (mat === "table" || mat === "view" || mat === "incremental" || mat === "ephemeral") {
      return mat;
    }
  }

  // Default to table
  return "table";
}

/**
 * Batch parse multiple SQL files
 */
export async function parseSqlFiles(filePaths: string[]): Promise<Map<string, DbtModel>> {
  const models = new Map<string, DbtModel>();

  const results = await Promise.all(filePaths.map((fp) => parseSqlFile(fp)));

  for (const model of results) {
    models.set(model.name, model);
  }

  return models;
}

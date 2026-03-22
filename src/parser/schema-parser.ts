import fs from "fs/promises";
import { parse } from "yaml";
import type { DbtModel } from "../types/model";

interface SchemaYaml {
  models?: Array<{
    name: string;
    description?: string;
    columns?: Array<{
      name: string;
      tests?: string[];
    }>;
    tests?: string[];
    tags?: string[];
  }>;
}

/**
 * Parses a schema.yml file and enrich models with tests and descriptions
 */
export async function parseSchemaYaml(filePath: string): Promise<Map<string, Partial<DbtModel>>> {
  const content = await fs.readFile(filePath, "utf-8");
  const schema: SchemaYaml = parse(content) || {};

  const enrichment = new Map<string, Partial<DbtModel>>();

  if (!schema.models) {
    return enrichment;
  }

  for (const modelDef of schema.models) {
    const tests: string[] = [];
    const tags = modelDef.tags || [];

    // Collect tests from model level
    if (modelDef.tests) {
      tests.push(...modelDef.tests);
    }

    // Collect tests from columns
    if (modelDef.columns) {
      for (const col of modelDef.columns) {
        if (col.tests) {
          tests.push(...col.tests);
        }
      }
    }

    enrichment.set(modelDef.name, {
      description: modelDef.description,
      tests,
      tags,
    });
  }

  return enrichment;
}

/**
 * Batch parse multiple schema files and merge enrichment data
 */
export async function parseSchemaFiles(
  filePaths: string[]
): Promise<Map<string, Partial<DbtModel>>> {
  const allEnrichment = new Map<string, Partial<DbtModel>>();

  const results = await Promise.all(filePaths.map((fp) => parseSchemaYaml(fp)));

  for (const enrichment of results) {
    for (const [modelName, data] of enrichment.entries()) {
      if (allEnrichment.has(modelName)) {
        // Merge with existing
        const existing = allEnrichment.get(modelName)!;
        allEnrichment.set(modelName, {
          description: data.description || existing.description,
          tests: [...(existing.tests || []), ...(data.tests || [])],
          tags: [...(existing.tags || []), ...(data.tags || [])],
        });
      } else {
        allEnrichment.set(modelName, data);
      }
    }
  }

  return allEnrichment;
}

/**
 * Merge enrichment data into models
 */
export function enrichModels(
  models: Map<string, DbtModel>,
  enrichment: Map<string, Partial<DbtModel>>
): void {
  for (const [modelName, data] of enrichment.entries()) {
    const model = models.get(modelName);
    if (model) {
      if (data.description) {
        model.description = data.description;
      }
      if (data.tests) {
        model.tests = [...new Set([...model.tests, ...data.tests])];
      }
      if (data.tags) {
        model.tags = [...new Set([...model.tags, ...data.tags])];
      }
    }
  }
}

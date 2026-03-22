import type { OrvyenConfig, Finding } from "../../types/index";
import { walkDirectory } from "../../parser/file-walker";
import { parseSqlFiles } from "../../parser/sql-parser";
import { parseSchemaFiles, enrichModels } from "../../parser/schema-parser";
import { DagBuilder } from "../../graph/dag-builder";
import { checkUnusedModels } from "../../checks/unused-models";
import { checkBrokenRefs } from "../../checks/broken-refs";
import { checkCircularDeps } from "../../checks/circular-deps";
import { checkMissingTests } from "../../checks/missing-tests";
import { checkDuplicateLogic } from "../../checks/duplicate-logic";
import { checkGrainMisalignment } from "../../checks/grain-misalignment";
import { checkUndocumentedModels } from "../../checks/undocumented-models";
import { checkGodModels } from "../../checks/god-models";
import { generateHtmlReport } from "../../reporter/html-reporter";
import { generateJsonReport } from "../../reporter/json-reporter";
import path from "path";

export interface AuditResult {
  findings: Finding[];
  modelCount: number;
  executionTime: number;
}

/**
 * Run full audit on a directory
 */
export async function runAudit(
  config: OrvyenConfig,
  projectDir: string
): Promise<AuditResult> {
  const startTime = Date.now();

  try {
    // Step 1: Collect files
    const files = await walkDirectory(projectDir, config.exclude);

    if (files.sqlFiles.length === 0) {
      return {
        findings: [],
        modelCount: 0,
        executionTime: Date.now() - startTime,
      };
    }

    // Step 2: Parse SQL files
    const models = await parseSqlFiles(files.sqlFiles);

    // Step 3: Parse schema files and enrich
    if (files.yamlFiles.length > 0) {
      const enrichment = await parseSchemaFiles(files.yamlFiles);
      enrichModels(models, enrichment);
    }

    // Step 4: Build DAG
    const dag = new DagBuilder(models);
    const nodes = dag.getNodes();

    // Step 5: Run all checks
    const allFindings: Finding[] = [];

    if (config.checks.unused_model !== false) {
      allFindings.push(...checkUnusedModels(nodes));
    }

    if (config.checks.broken_ref !== false) {
      allFindings.push(...checkBrokenRefs(nodes));
    }

    if (config.checks.circular_dependency !== false) {
      allFindings.push(...checkCircularDeps(nodes));
    }

    if (config.checks.missing_tests !== false) {
      allFindings.push(...checkMissingTests(nodes));
    }

    if (config.checks.duplicate_logic !== false) {
      allFindings.push(...checkDuplicateLogic(nodes));
    }

    if (config.checks.grain_misalignment !== false) {
      allFindings.push(...checkGrainMisalignment(nodes));
    }

    if (config.checks.undocumented_model !== false) {
      allFindings.push(...checkUndocumentedModels(nodes));
    }

    if (config.checks.god_model !== false) {
      allFindings.push(...checkGodModels(nodes));
    }

    const executionTime = Date.now() - startTime;

    // Step 6: Generate reports based on config
    await generateReports(
      allFindings,
      projectDir,
      models.size,
      executionTime,
      config
    );

    return {
      findings: allFindings,
      modelCount: models.size,
      executionTime,
    };
  } catch (error) {
    console.error("Error during audit:", error);
    throw error;
  }
}

/**
 * Generate output reports based on config
 */
async function generateReports(
  findings: Finding[],
  projectDir: string,
  modelCount: number,
  executionTime: number,
  config: OrvyenConfig
): Promise<void> {
  const formats = Array.isArray(config.output)
    ? config.output
    : config.output === "all"
      ? ["terminal", "html", "json"]
      : [config.output];

  for (const format of formats) {
    switch (format) {
      case "html":
        await generateHtmlReport(
          {
            findings,
            modelCount,
            projectDir,
            timestamp: new Date().toLocaleString(),
            executionTime,
          },
          path.join(config.outputDir, "report.html")
        );
        break;

      case "json":
        await generateJsonReport(
          findings,
          projectDir,
          modelCount,
          executionTime,
          path.join(config.outputDir, "report.json")
        );
        break;

      case "terminal":
        // Terminal output handled by caller
        break;
    }
  }
}

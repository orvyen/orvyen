#!/usr/bin/env node

import path from "path";
import chalk from "chalk";
import { runAudit } from "./cli/commands/audit";
import { initConfig } from "./cli/commands/init";
import { watch } from "./cli/commands/watch";
import { startInteractiveUI } from "./ui/index";
import {
  printHeader,
  printStatus,
  printError,
  printSummary,
} from "./cli/display";
import { printFindings } from "./reporter/terminal-reporter";
import { generateHtmlReport } from "./reporter/html-reporter";
import type { OrvyenConfig } from "./types/index";

const defaultConfig: OrvyenConfig = {
  include: ["models/**/*.sql"],
  exclude: [],
  checks: {
    unused_model: true,
    missing_tests: true,
    duplicate_logic: true,
    broken_ref: true,
    grain_misalignment: true,
    circular_dependency: true,
    undocumented_model: true,
    god_model: true,
  },
  output: "terminal",
  outputDir: ".orvyen",
};

interface CliArgs {
  command: string | null;
  targetDir: string;
  format: "terminal" | "html" | "json" | "all";
  watch: boolean;
  help: boolean;
  interactive: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    command: null,
    targetDir: process.cwd(),
    format: "terminal",
    watch: false,
    help: false,
    interactive: args.length === 0, // Default to interactive if no args
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "init") {
      result.command = "init";
    } else if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--interactive" || arg === "-i") {
      result.interactive = true;
    } else if (arg === "--watch" || arg === "-w") {
      result.watch = true;
    } else if (arg === "--format" && args[i + 1]) {
      const format = args[++i];
      if (["terminal", "html", "json", "all"].includes(format)) {
        result.format = format as OrvyenConfig["output"];
      } else {
        printError(`Invalid format: ${format}`);
        process.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      // Assume it's the target directory
      result.targetDir = arg;
      result.interactive = false; // Don't use interactive if a target is specified
    }
  }

  return result;
}

function showHelp(): void {
  const title = chalk.cyan.bold('  ORVYEN')
  const subtitle = chalk.dim('SQL Architecture Auditor')
  const divider = chalk.dim('  ' + '─'.repeat(58));
  
  console.log(`
${title} ${subtitle}
${divider}

  USAGE:
    npx orvyen                  Interactive mode (default if no args)
    npx orvyen [directory]      Audit a specific directory
    npx orvyen init             Create configuration file
    npx orvyen --help           Show this help message

  OPTIONS:
    --interactive, -i       Launch interactive mode
    --format <type>         Output format: terminal, html, json, all (default: terminal)
    --watch, -w             Re-run audit when files change
    --help, -h              Show this help message

  EXAMPLES:
    npx orvyen                          (interactive mode)
    npx orvyen ./models
    npx orvyen ./models --format html
    npx orvyen ./models --watch
    npx orvyen init

  LEARN MORE:
    https://orvyen.com

`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    return;
  }

  // Launch interactive mode
  if (args.interactive) {
    try {
      await startInteractiveUI();
      return;
    } catch (error) {
      printError(
        `Interactive mode failed: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  if (args.command === "init") {
    try {
      const configPath = await initConfig();
      console.log(`\n✅ Created config file at: ${configPath}\n`);
      console.log("Edit it to customize your audit settings.\n");
      return;
    } catch (error) {
      printError(
        `Failed to initialize config: ${error instanceof Error ? error.message : String(error)}`
      );
      process.exit(1);
    }
  }

  try {
    printHeader();

    const resolvedDir = path.resolve(args.targetDir);
    const config: OrvyenConfig = {
      ...defaultConfig,
      output: args.format as "terminal" | "html" | "json" | "all",
    };

    printStatus(`Auditing: ${resolvedDir}`);

    if (args.watch) {
      await watch(config, resolvedDir, () => {
        // Callback after each audit in watch mode
      });
    } else {
      // Run single audit
      const result = await runAudit(config, resolvedDir);

      // Handle different output formats
      if (args.format === "json") {
        console.log(JSON.stringify({
          models: result.modelCount,
          findings: result.findings,
          executionTime: result.executionTime,
        }, null, 2));
      } else if (args.format === "html") {
        const reportPath = path.join(process.cwd(), "orvyen-report.html");
        await generateHtmlReport(
          {
            findings: result.findings,
            modelCount: result.modelCount,
            projectDir: resolvedDir,
            timestamp: new Date().toISOString(),
            executionTime: result.executionTime,
          },
          reportPath
        );
        console.log("\n✅ HTML report generated: orvyen-report.html\n");
      } else if (args.format === "all") {
        // Print terminal output
        console.log(printFindings(result.findings));
        // Also generate HTML
        const reportPath = path.join(process.cwd(), "orvyen-report.html");
        await generateHtmlReport(
          {
            findings: result.findings,
            modelCount: result.modelCount,
            projectDir: resolvedDir,
            timestamp: new Date().toISOString(),
            executionTime: result.executionTime,
          },
          reportPath
        );
        console.log("\n✅ HTML report also generated: orvyen-report.html\n");
      } else {
        // Default: terminal output
        console.log(printFindings(result.findings));
      }

      // Print summary for terminal and all modes
      if (args.format !== "json") {
        printSummary(
          result.modelCount,
          result.findings.length,
          result.executionTime
        );
      }

      // Exit with error code if critical findings
      const criticalCount = result.findings.filter(
        (f) => f.severity === "critical"
      ).length;
      if (criticalCount > 0) {
        process.exit(1);
      }
    }
  } catch (error) {
    printError(
      `Audit failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

main();

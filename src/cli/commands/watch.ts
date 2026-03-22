import fs from "fs";
import path from "path";
import type { OrvyenConfig } from "../../types/config";
import { runAudit } from "./audit";

/**
 * Watch mode - re-run audit when SQL files change
 */
export async function watch(
  config: OrvyenConfig,
  projectDir: string,
  onAuditComplete?: () => void
): Promise<void> {
  console.log(`\n👀 Watching for changes in ${projectDir}...\n`);

  let isRunning = false;
  let pendingRerun = false;
  let lastBuildTime = Date.now();

  const watcher = fs.watch(
    projectDir,
    { recursive: true },
    async (eventType, filename) => {
      // Skip non-SQL/YAML files
      if (!filename) return;
      if (!isSqlOrYamlFile(filename)) return;

      // Debounce: wait 100ms before rerunning
      const now = Date.now();
      if (now - lastBuildTime < 100) {
        pendingRerun = true;
        return;
      }

      if (isRunning) {
        pendingRerun = true;
        return;
      }

      isRunning = true;
      lastBuildTime = now;
      pendingRerun = false;

      try {
        console.clear();
        console.log(`\n🔄 Re-running audit (${new Date().toLocaleTimeString()})...\n`);

        await runAudit(config, projectDir);

        if (onAuditComplete) {
          onAuditComplete();
        }

        if (pendingRerun) {
          // File changed while we were running, re-run immediately
          pendingRerun = false;
          isRunning = false;
          await watch(config, projectDir, onAuditComplete);
          return;
        }
      } catch (error) {
        console.error("Audit failed:", error);
      } finally {
        isRunning = false;
      }
    }
  );

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping watch mode...");
    watcher.close();
    process.exit(0);
  });
}

function isSqlOrYamlFile(filename: string): boolean {
  return (
    filename.endsWith(".sql") ||
    filename.endsWith(".yml") ||
    filename.endsWith(".yaml") ||
    filename.endsWith("schema.yml") ||
    filename.endsWith("manifest.json")
  );
}

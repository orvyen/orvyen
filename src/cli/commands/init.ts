import fs from "fs/promises";
import path from "path";

const CONFIG_TEMPLATE = `/**
 * Orvyen Configuration
 * Learn more: https://orvyen.com/docs/config
 */

export default {
  // File patterns to include
  include: ["models/**/*.sql"],

  // File patterns to exclude
  exclude: ["models/**/*staging*.sql"],

  // Enable or configure specific checks
  checks: {
    unused_model: true,
    missing_tests: { severity: "high" },
    duplicate_logic: true,
    broken_ref: true,
    grain_misalignment: { severity: "high" },
    circular_dependency: true,
    undocumented_model: false,
    god_model: true,
  },

  // Output formats: "terminal" | "html" | "json" | "all"
  output: "all",

  // Directory where reports are saved
  outputDir: ".orvyen",
};
`;

/**
 * Initialize a new Orvyen config file
 */
export async function initConfig(workingDir: string = process.cwd()): Promise<string> {
  const configPath = path.join(workingDir, ".orvyen.config.js");

  // Check if config already exists
  try {
    await fs.access(configPath);
    throw new Error(`Config file already exists at ${configPath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  // Write config file
  await fs.writeFile(configPath, CONFIG_TEMPLATE, "utf-8");

  return configPath;
}

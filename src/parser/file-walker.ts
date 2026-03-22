import fs from "fs/promises";
import path from "path";

export interface FileCollection {
  sqlFiles: string[];
  yamlFiles: string[];
  manifestPath?: string;
}

/**
 * Recursively walks a directory and collects SQL and YAML files
 */
export async function walkDirectory(
  dirPath: string,
  exclude: string[] = []
): Promise<FileCollection> {
  const sqlFiles: string[] = [];
  const yamlFiles: string[] = [];
  let manifestPath: string | undefined;

  // Normalize exclude patterns
  const excludePatterns = exclude.map((p) => p.toLowerCase());

  async function walkRecursive(currentPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(dirPath, fullPath).toLowerCase();

        // Check if should exclude
        if (shouldExclude(relativePath, excludePatterns)) {
          continue;
        }

        if (entry.isDirectory()) {
          // Skip node_modules and hidden folders
          if (entry.name === "node_modules" || entry.name.startsWith(".")) {
            continue;
          }
          await walkRecursive(fullPath);
        } else if (entry.isFile()) {
          if (entry.name.endsWith(".sql")) {
            sqlFiles.push(fullPath);
          } else if (
            entry.name.endsWith(".yml") ||
            entry.name.endsWith(".yaml")
          ) {
            yamlFiles.push(fullPath);
            // Check for manifest
            if (entry.name === "manifest.json") {
              manifestPath = fullPath;
            }
          } else if (entry.name === "manifest.json") {
            manifestPath = fullPath;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
      if (
        error instanceof Error &&
        "code" in error &&
        error.code !== "EACCES"
      ) {
        throw error;
      }
    }
  }

  await walkRecursive(dirPath);

  return {
    sqlFiles: sqlFiles.sort(),
    yamlFiles: yamlFiles.sort(),
    manifestPath,
  };
}

function shouldExclude(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Simple glob matching
    if (pattern.includes("*")) {
      const regex = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
      );
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

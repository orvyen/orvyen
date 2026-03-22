import chalk from "chalk";

/**
 * Print ASCII banner
 */
function printBanner(): void {
  const logo = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                                                               ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.bold.cyan(' ██████╗ ██████╗ ██╗   ██╗██╗   ██╗███████╗███╗   ██╗')}  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.bold.cyan('██╔═══██╗██╔══██╗██║   ██║██║   ██║██╔════╝████╗  ██║')}  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.bold.cyan('██║   ██║██████╔╝██║   ██║██║   ██║█████╗  ██╔██╗ ██║')}  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.bold.cyan('██║   ██║██╔══██╗╚██╗ ██╔╝██║   ██║██╔══╝  ██║╚██╗██║')}  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.bold.cyan('╚██████╔╝██║  ██║ ╚████╔╝ ╚██████╔╝███████╗██║ ╚████║')}  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.bold.cyan(' ╚═════╝ ╚═╝  ╚═╝  ╚═══╝   ╚═════╝ ╚══════╝╚═╝  ╚═══╝')}  ${chalk.cyan('║')}
${chalk.cyan('║')}                                                               ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.green.bold('SQL Architecture Auditor')}                                  ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim('The intelligent way to audit your SQL codebase')}           ${chalk.cyan('║')}
${chalk.cyan('║')}                                                               ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════════╝')}
  `
  console.log(logo)
}

/**
 * Print CLI header
 */
export function printHeader(): void {
  printBanner()
}


/**
 * Print status message
 */
export function printStatus(message: string): void {
  console.log(chalk.blue(`ℹ️  ${message}`));
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  console.log(chalk.green(`✓ ${message}`));
}

/**
 * Print error message
 */
export function printError(message: string): void {
  console.log(chalk.red(`✗ ${message}`));
}

/**
 * Print warning message
 */
export function printWarning(message: string): void {
  console.log(chalk.yellow(`⚠ ${message}`));
}

/**
 * Print audit summary
 */
export function printSummary(
  modelCount: number,
  findingCount: number,
  executionTime: number
): void {
  console.log(chalk.bold("\nAudit Summary:"));
  console.log(`  Models analyzed: ${modelCount}`);
  console.log(`  Findings: ${findingCount}`);
  console.log(`  Time: ${(executionTime / 1000).toFixed(2)}s`);
  console.log();
}

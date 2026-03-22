import chalk from 'chalk'

/**
 * ASCII art banner for Orvyen CLI
 */
export function printBanner(): void {
  const line1 = '  ╔═══════════════════════════════════════════════════════════╗'
  const line2 = '  ║                                                           ║'
  const line3 = '  ║   ◇ ORVYEN — SQL Architecture Auditor                    ║'
  const line4 = '  ║                                                           ║'
  const line5 = '  ║   Audit dbt and SQL codebases for architectural issues   ║'
  const line6 = '  ║                                                           ║'
  const line7 = '  ╚═══════════════════════════════════════════════════════════╝'

  console.log(chalk.cyan(line1))
  console.log(chalk.cyan(line2))
  console.log(chalk.cyan.bold(line3))
  console.log(chalk.cyan(line4))
  console.log(chalk.cyan.dim(line5))
  console.log(chalk.cyan(line6))
  console.log(chalk.cyan(line7))
}

/**
 * Compact banner variant (for --help)
 */
export function printCompactBanner(): void {
  const title = chalk.cyan.bold('◇ ORVYEN')
  const subtitle = chalk.dim('SQL Architecture Auditor')
  console.log(`\n${title} — ${subtitle}\n`)
}

/**
 * Welcome message for interactive mode
 */
export function printWelcome(): void {
  printBanner()
  console.log(chalk.gray.italic('\n  Let\'s audit your SQL codebase...\n'))
}


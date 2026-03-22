import chalk from 'chalk'

/**
 * ASCII art banner for Orvyen CLI
 */
export function printBanner(): void {
  const cat = `  /\\_/\\
 ( o.o ) 😸
  > ^ <
 /|   |\\
(_|   |_)`
  console.log(chalk.yellow(cat))
  console.log()
  console.log(chalk.green.bold('SQL Architecture Auditor'))
  console.log(chalk.dim('The intelligent way to audit your SQL codebase'))
  console.log()
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


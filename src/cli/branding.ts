import chalk from 'chalk'

/**
 * ASCII art banner for Orvyen CLI
 */
export function printBanner(): void {
  const logo = `
${chalk.bold.cyan(' ██████╗  ██████╗ ██████╗ ██╗   ██╗███████╗███╗   ██╗')}
${chalk.bold.cyan('██╔═══██╗██╔═══██╗██╔══██╗██║   ██║██╔════╝████╗  ██║')}
${chalk.bold.cyan('██║   ██║██║   ██║██║  ██║██║   ██║█████╗  ██╔██╗ ██║')}
${chalk.bold.cyan('██║   ██║██║   ██║██║  ██║██║   ██║██╔══╝  ██║╚██╗██║')}
${chalk.bold.cyan('╚██████╔╝╚██████╔╝██████╔╝╚██████╔╝███████╗██║ ╚████║')}
${chalk.bold.cyan(' ╚═════╝  ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═══╝')}

${chalk.green.bold('SQL Architecture Auditor')}
${chalk.dim('The intelligent way to audit your SQL codebase')}
  `
  console.log(logo)
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


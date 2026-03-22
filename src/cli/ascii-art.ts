import chalk from 'chalk'

/**
 * Large ASCII art logo for Orvyen
 */
export function printLargeBanner(): void {
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
 * Compact banner for help
 */
export function printCompactBanner(): void {
  const logo = `
${chalk.cyan('  ◇ ORVYEN')} ${chalk.dim('— SQL Architecture Auditor')}
${chalk.dim('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
  `
  console.log(logo)
}

/**
 * Spinner frames for loading animation
 */
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/**
 * Simple spinner that runs for a duration
 */
export function createSpinner(duration: number = 3000): {
  stop: () => void
} {
  let frameIndex = 0
  let isRunning = true

  const interval = setInterval(() => {
    if (!isRunning) return
    process.stdout.write(`\r  ${chalk.cyan(spinnerFrames[frameIndex])} ${chalk.cyan('Running audit...')}`)
    frameIndex = (frameIndex + 1) % spinnerFrames.length
  }, 100)

  // Auto-stop after duration
  const timeout = setTimeout(() => {
    isRunning = false
    clearInterval(interval)
    process.stdout.write('\r' + ' '.repeat(50) + '\r') // Clear line
  }, duration)

  return {
    stop() {
      isRunning = false
      clearInterval(interval)
      clearTimeout(timeout)
      process.stdout.write('\r' + ' '.repeat(50) + '\r') // Clear line
    },
  }
}

/**
 * Print loading message with animation
 */
export function printLoading(message: string = 'Running audit'): void {
  process.stdout.write(`\n  ${chalk.cyan('⠋')} ${chalk.cyan(message)}...\n`)
}

/**
 * Print success message
 */
export function printSuccess(message: string): void {
  process.stdout.write(`\n  ${chalk.green('✓')} ${chalk.green.bold(message)}\n\n`)
}

/**
 * Print section divider
 */
export function printDivider(): void {
  console.log(chalk.cyan('  ' + '─'.repeat(60)))
}

/**
 * Print section header
 */
export function printSectionHeader(title: string): void {
  console.log()
  console.log(chalk.cyan.bold(`  ▸ ${title}`))
  printDivider()
}

/**
 * SQL Architecture Auditor Logo Animation Module
 *
 * Renders branded logo with startup reveal and pulsing load animation.
 * Two modes:
 * 1. startIntro(): Reveals logo top-to-bottom with title fade-in
 * 2. startLoading(): Pulses logo slashes while showing "Auditing..." status
 *
 * @example
 * ```typescript
 * import { startIntro, startLoading } from './animation/logoAnimation';
 *
 * // Startup intro
 * await startIntro();
 * console.log('Main CLI...');
 *
 * // Loading animation
 * const stop = startLoading();
 * await runAudit();
 * stop();
 * ```
 */

import { stdout, stderr } from 'process';

// ============================================================================
// ANSI Escape Codes
// ============================================================================

const ANSI = {
  clearScreen: '\x1b[2J',
  cursorHome: '\x1b[H',
  cursorUp: (n: number): string => `\x1b[${n}A`,
  clearLine: '\x1b[2K',
  clearBelow: '\x1b[0J',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  bgBlack: '\x1b[48;2;10;10;10m',
} as const;

// ============================================================================
// Brand Colors (True Color / 24-bit RGB)
// ============================================================================

const COLOR = {
  black: (intensity: number = 10): string =>
    `\x1b[38;2;${intensity};${intensity};${intensity}m`,
  white: (intensity: number = 255): string =>
    `\x1b[38;2;${intensity};${intensity};${intensity}m`,
  gray: (intensity: number = 60): string =>
    `\x1b[38;2;${intensity};${intensity};${intensity}m`,
  title: '\x1b[38;2;255;255;255m', // White
  subtitle: '\x1b[38;2;130;130;130m', // Dim gray
} as const;

// ============================================================================
// Logo ASCII Map
// ============================================================================

const LOGO_MAP = [
  'S G KKKKKKKKKKKKKKK G S  ',
  ' GKKKKKKKKKKKKKKG  GK ',
  ' GKKKKKKKKKGKK  GKKK ',
  ' GKKKKKKKKKSS S KKKKK ',
  ' GKKKKKKKKGSSS GKKKKKKG',
  ' GKKKKK SSSS KKKKKKKKG',
  ' GKKKKG SS KKKKKKKKKk',
  ' GKK G  KKG GKKKKKKKKKK',
  ' G   GKKKKKKKKKKKKKKKKK',
  ' S  GKKKKKKKKKKKKKKKKKKK',
];

const LOGO_HEIGHT = LOGO_MAP.length;
const TITLE = 'SQL Architecture Auditor';
const SUBTITLE = 'audit your SQL codebase';
const TITLE_START_LINE = 4; // Line where title appears
const SUBTITLE_START_LINE = 5; // Line where subtitle appears

// ============================================================================
// Animation State
// ============================================================================

interface AnimationState {
  isRunning: boolean;
  startTime: number;
  frameIndex: number;
  intervalId: NodeJS.Timeout | null;
  linesDrawn: number;
}

const state: AnimationState = {
  isRunning: false,
  startTime: 0,
  frameIndex: 0,
  intervalId: null,
  linesDrawn: 0,
};

// ============================================================================
// Helper: Render Logo Character to ANSI
// ============================================================================

function renderLogoChar(char: string, pulseIntensity?: number): string {
  if (char === 'K') {
    // Black body
    return COLOR.black() + '█' + ANSI.reset;
  } else if (char === 'S') {
    // White slash (animates during loading)
    const intensity = pulseIntensity ?? 255;
    return COLOR.white(intensity) + '▒' + ANSI.reset;
  } else if (char === 'G') {
    // Gray border
    return COLOR.gray() + '░' + ANSI.reset;
  } else if (char === 'k') {
    // Lowercase k is also black
    return COLOR.black() + '█' + ANSI.reset;
  } else {
    // Space / transparent (with black background)
    return ' ';
  }
}

// ============================================================================
// Scenario 1: Intro Animation (Reveal + Title Fade)
// ============================================================================

export function startIntro(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (state.isRunning) {
      resolve();
      return;
    }

    state.isRunning = true;
    state.startTime = Date.now();
    state.frameIndex = 0;
    state.linesDrawn = 0;

    const removeSignalHandlers = setupSignalHandlers();

    // Prepare terminal
    stdout.write(ANSI.hideCursor);
    stdout.write(ANSI.clearScreen);
    stdout.write(ANSI.cursorHome);

    const lineDelayMs = 50;

    state.intervalId = setInterval(() => {
      try {
        // Phase 1: Reveal logo lines (0-500ms)
        if (state.frameIndex < LOGO_HEIGHT) {
          const logoLine = LOGO_MAP[state.frameIndex];
          let output = ANSI.bgBlack;

          // Render logo characters
          for (const char of logoLine) {
            output += renderLogoChar(char);
          }

          // Add title to the right of line 4
          if (state.frameIndex === TITLE_START_LINE) {
            output += '  ' + ANSI.bold + COLOR.title + TITLE + ANSI.reset;
          }
          // Add subtitle to the right of line 5
          else if (state.frameIndex === SUBTITLE_START_LINE) {
            output += '  ' + COLOR.subtitle + SUBTITLE + ANSI.reset;
          }

          stdout.write(output + '\n');
          state.linesDrawn++;
          state.frameIndex++;
        }
        // Phase 2: Hold for ~500ms, then complete
        else {
          const elapsed = Date.now() - state.startTime;
          if (elapsed > 1000) {
            clearInterval(state.intervalId);
            state.intervalId = null;
            state.isRunning = false;

            // Final output: clear and show complete logo with title
            stdout.write(ANSI.cursorHome);
            stdout.write(ANSI.clearBelow);

            for (let i = 0; i < LOGO_HEIGHT; i++) {
              const logoLine = LOGO_MAP[i];
              let output = ANSI.bgBlack;

              for (const char of logoLine) {
                output += renderLogoChar(char);
              }

              if (i === TITLE_START_LINE) {
                output +=
                  '  ' +
                  ANSI.bold +
                  COLOR.title +
                  TITLE +
                  ANSI.reset;
              } else if (i === SUBTITLE_START_LINE) {
                output += '  ' + COLOR.subtitle + SUBTITLE + ANSI.reset;
              }

              stdout.write(output + '\n');
            }

            stdout.write('\n');
            stdout.write(ANSI.showCursor);
            removeSignalHandlers();
            resolve();
          }
        }
      } catch (error) {
        cleanup();
        removeSignalHandlers();
        reject(error);
      }
    }, lineDelayMs);
  });
}

// ============================================================================
// Scenario 2: Loading Animation (Pulsing Slash + Auditing Dots)
// ============================================================================

export function startLoading(): () => void {
  if (state.isRunning) {
    return () => {
      // No-op
    };
  }

  state.isRunning = true;
  state.startTime = Date.now();
  state.frameIndex = 0;
  state.linesDrawn = 0;

  const removeSignalHandlers = setupSignalHandlers();
  const frameDelayMs = 150;

  // Prepare terminal
  stdout.write(ANSI.hideCursor);
  stdout.write(ANSI.clearScreen);
  stdout.write(ANSI.cursorHome);

  state.intervalId = setInterval(() => {
    try {
      const elapsed = Date.now() - state.startTime;

      // Pulse cycle: 255 → 200 → 140 → 200 → 255 (5 frames)
      const pulsePhase = Math.floor((elapsed / frameDelayMs) % 5);
      let pulseIntensity = 255;

      if (pulsePhase === 0) {
        pulseIntensity = 255;
      } else if (pulsePhase === 1) {
        pulseIntensity = 200;
      } else if (pulsePhase === 2) {
        pulseIntensity = 140;
      } else if (pulsePhase === 3) {
        pulseIntensity = 200;
      } else {
        pulseIntensity = 255;
      }

      // Calculate pulsing dots for "Auditing..."
      const dotCycle = Math.floor((elapsed / 200) % 4);
      const dots = '.'.repeat(Math.max(0, dotCycle));
      const auditingText = `${COLOR.subtitle}Auditing${dots}${ANSI.reset}`;

      // Clear and redraw
      stdout.write(ANSI.cursorHome);
      stdout.write(ANSI.clearBelow);

      // Render logo with pulsing effect
      for (let i = 0; i < LOGO_HEIGHT; i++) {
        const logoLine = LOGO_MAP[i];
        let output = ANSI.bgBlack;

        for (const char of logoLine) {
          output += renderLogoChar(char, pulseIntensity);
        }

        // Keep title and replace subtitle with auditing status
        if (i === TITLE_START_LINE) {
          output +=
            '  ' + ANSI.bold + COLOR.title + TITLE + ANSI.reset;
        } else if (i === SUBTITLE_START_LINE) {
          output += '  ' + auditingText;
        }

        stdout.write(output + '\n');
      }

      state.frameIndex++;
    } catch (error) {
      cleanup();
      removeSignalHandlers();
      stderr.write(
        `Error in loading animation: ${
          error instanceof Error ? error.message : String(error)
        }\n`
      );
    }
  }, frameDelayMs);

  // Return stop function
  return (): void => {
    cleanup();
    removeSignalHandlers();
  };
}

// ============================================================================
// Cleanup & Signal Handling
// ============================================================================

function cleanup(): void {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.isRunning = false;
  stdout.write(ANSI.showCursor);
  stdout.write(ANSI.clearScreen);
  stdout.write(ANSI.cursorHome);
}

function setupSignalHandlers(): () => void {
  const sigintHandler = (): void => {
    cleanup();
    process.exit(0);
  };

  const errorHandler = (error: Error | string): void => {
    cleanup();
    const msg = error instanceof Error ? error.message : String(error);
    stderr.write(`\nError: ${msg}\n`);
    process.exit(1);
  };

  process.on('SIGINT', sigintHandler);
  process.on('uncaughtException', errorHandler);
  process.on('unhandledRejection', (reason) => {
    errorHandler(
      reason instanceof Error ? reason : new Error(String(reason))
    );
  });

  return (): void => {
    process.removeListener('SIGINT', sigintHandler);
    process.removeListener('uncaughtException', errorHandler);
    process.removeListener('unhandledRejection', errorHandler);
  };
}

// ============================================================================
// Failsafe: Cleanup on module exit
// ============================================================================

process.on('exit', () => {
  if (state.isRunning) {
    cleanup();
  }
});

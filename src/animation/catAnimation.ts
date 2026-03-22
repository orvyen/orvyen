/**
 * Cat ASCII Animation Module
 *
 * Two animation modes for CLI startup and loading states:
 * 1. startIntro(): Animates cat typing in line-by-line, fades tagline, then exits
 * 2. startLoading(): Loops cat blinking/twitching with pulsing "Auditing..." text until stop()
 *
 * @example
 * ```typescript
 * import { startIntro, startLoading } from './animation/catAnimation';
 *
 * // Intro on startup
 * await startIntro();
 * console.log('Main CLI output...');
 *
 * // Loading animation during async work
 * const stop = startLoading();
 * await auditProject();
 * stop(); // Cleans up and clears animation
 * ```
 */

import { stdout, stderr } from 'process';

// ============================================================================
// ANSI Escape Codes
// ============================================================================

const ANSI = {
  clearScreen: '\u001B[2J',
  cursorHome: '\u001B[H',
  cursorUp: (n: number): string => `\u001B[${n}A`,
  clearLine: '\u001B[2K',
  clearBelow: '\u001B[0J',
  hideCursor: '\u001B[?25l',
  showCursor: '\u001B[?25h',
  reset: '\u001B[0m',
  bold: '\u001B[1m',
  dim: '\u001B[2m',
  yellow: '\u001B[33m',
  green: '\u001B[32m',
  cyan: '\u001B[36m',
  gray: '\u001B[90m',
} as const;

// ============================================================================
// Animation State
// ============================================================================

interface AnimationState {
  isRunning: boolean;
  startTime: number;
  frameIndex: number;
  intervalId: NodeJS.Timeout | null;
  linesWritten: number;
}

const state: AnimationState = {
  isRunning: false,
  startTime: 0,
  frameIndex: 0,
  intervalId: null,
  linesWritten: 0,
};

// ============================================================================
// Cat ASCII Art Frames
// ============================================================================

const catLines = [
  '  /\\_/\\',
  ' ( o.o )',
  '  > ^ <',
  ' /|   |\\',
  '(_|   |_)',
];

const tagline = '  SQL Architecture Auditor';
const subtitle = '  The intelligent way to audit your SQL codebase';

// Blinking cat frames (eyes changing)
const blinkFrames = [
  [
    '  /\\_/\\',
    ' ( o.o )',
    '  > ^ <',
    ' /|   |\\',
    '(_|   |_)',
  ],
  [
    '  /\\_/\\',
    ' ( -.-)  ',
    '  > ^ <',
    ' /|   |\\',
    '(_|   |_)',
  ],
];

// Twitching tail frames
const tailTwitchFrames = [
  [
    '  /\\_/\\',
    ' ( o.o )',
    '  > ^ <',
    ' /|   |\\',
    '(_|   |_)',
  ],
  [
    '  /\\_/\\',
    ' ( o.o )',
    '  > ^ <',
    ' /|   |\\\\',
    '(_|   |_) ',
  ],
];

// ============================================================================
// Cleanup & Signal Handling
// ============================================================================

function cleanup(): void {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  state.isRunning = false;

  // Restore cursor and clear animation area
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
    errorHandler(reason instanceof Error ? reason : new Error(String(reason)));
  });

  return (): void => {
    process.removeListener('SIGINT', sigintHandler);
    process.removeListener('uncaughtException', errorHandler);
    process.removeListener('unhandledRejection', errorHandler);
  };
}

// ============================================================================
// Scenario 1: Intro Animation (Type-in + Fade)
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
    state.linesWritten = 0;

    const removeSignalHandlers = setupSignalHandlers();

    // Prepare terminal
    stdout.write(ANSI.hideCursor);
    stdout.write(ANSI.clearScreen);
    stdout.write(ANSI.cursorHome);

    const introFrameDelayMs = 120; // Delay between lines
    const fadeDelayMs = 800; // How long before tagline starts fading
    const totalDurationMs = 1500; // Total intro duration

    state.intervalId = setInterval(() => {
      try {
        const elapsed = Date.now() - state.startTime;

        // Phase 1: Type cat lines (0-600ms)
        if (state.frameIndex < catLines.length) {
          stdout.write(catLines[state.frameIndex] + '\n');
          state.linesWritten++;
          state.frameIndex++;
        }
        // Phase 2: Display cat and fade in tagline (600-1500ms)
        else if (elapsed < totalDurationMs) {
          const fadeProgress = Math.max(0, elapsed - fadeDelayMs) / 400;
          const opacity = Math.min(1, fadeProgress);

          // Move cursor back to clear and redraw
          stdout.write(ANSI.cursorUp(state.linesWritten + 2));
          stdout.write(ANSI.clearBelow);

          // Redraw cat
          for (const line of catLines) {
            stdout.write(line + '\n');
          }

          // Fade in tagline
          if (opacity > 0) {
            const taglineColor =
              opacity < 1
                ? ANSI.dim + ANSI.gray
                : ANSI.green + ANSI.bold;
            stdout.write(taglineColor + tagline + ANSI.reset + '\n');

            if (opacity > 0.5) {
              stdout.write(ANSI.dim + subtitle + ANSI.reset + '\n');
            }
          }

          state.linesWritten = catLines.length + 2;
        }
        // Phase 3: Intro complete
        else {
          clearInterval(state.intervalId);
          state.intervalId = null;
          state.isRunning = false;

          // Final display
          stdout.write(ANSI.cursorHome);
          stdout.write(ANSI.clearScreen);

          for (const line of catLines) {
            stdout.write(line + '\n');
          }
          stdout.write(ANSI.green + ANSI.bold + tagline + ANSI.reset + '\n');
          stdout.write(ANSI.dim + subtitle + ANSI.reset + '\n');
          stdout.write('\n');

          stdout.write(ANSI.showCursor);
          removeSignalHandlers();
          resolve();
        }
      } catch (error) {
        cleanup();
        removeSignalHandlers();
        reject(error);
      }
    }, introFrameDelayMs);
  });
}

// ============================================================================
// Scenario 2: Loading Animation (Blink + Twitch + Pulse)
// ============================================================================

export function startLoading(): () => void {
  if (state.isRunning) {
    return () => {
      // No-op if already running
    };
  }

  state.isRunning = true;
  state.startTime = Date.now();
  state.frameIndex = 0;
  state.linesWritten = 0;

  const removeSignalHandlers = setupSignalHandlers();
  const loadingFrameDelayMs = 150;

  // Prepare terminal
  stdout.write(ANSI.hideCursor);
  stdout.write(ANSI.clearScreen);
  stdout.write(ANSI.cursorHome);

  state.intervalId = setInterval(() => {
    try {
      const elapsed = Date.now() - state.startTime;
      const cycleTime = elapsed % 3000; // 3 second cycle for blink + twitch

      // Select animation frame
      let frameLines: string[];

      if (cycleTime < 500) {
        // Blink frame 1
        frameLines = blinkFrames[0];
      } else if (cycleTime < 700) {
        // Blink frame 2 (eyes closed)
        frameLines = blinkFrames[1];
      } else if (cycleTime < 1500) {
        // Tail twitch frame 1
        frameLines = tailTwitchFrames[0];
      } else if (cycleTime < 1700) {
        // Tail twitch frame 2
        frameLines = tailTwitchFrames[1];
      } else {
        // Back to normal
        frameLines = blinkFrames[0];
      }

      // Calculate pulsing dots for "Auditing..."
      const dotCycle = Math.floor((elapsed / 200) % 4);
      const dots = '.'.repeat(dotCycle);
      const auditingText = `${ANSI.yellow}Auditing${dots}${ANSI.reset}`;

      // Clear and redraw
      stdout.write(ANSI.cursorHome);
      stdout.write(ANSI.clearBelow);

      // Draw cat
      for (const line of frameLines) {
        stdout.write(line + '\n');
      }

      // Draw pulsing "Auditing..." text
      stdout.write('\n' + auditingText + '\n');

      state.linesWritten = frameLines.length + 2;
    } catch (error) {
      cleanup();
      removeSignalHandlers();
      stderr.write(
        `Error in loading animation: ${error instanceof Error ? error.message : String(error)}\n`
      );
    }
  }, loadingFrameDelayMs);

  // Return stop function
  return (): void => {
    cleanup();
    removeSignalHandlers();
  };
}

// ============================================================================
// Cleanup on Module Unload (failsafe)
// ============================================================================

process.on('exit', () => {
  if (state.isRunning) {
    cleanup();
  }
});

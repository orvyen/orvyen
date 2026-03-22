/**
 * Nyan Cat ASCII Animation Module
 *
 * A reusable animation for CLI applications with two modes:
 * 1. Intro animation: Fixed-duration display (default 1.8s)
 * 2. Loading animation: Continuous loop until stopped
 *
 * @example
 * ```typescript
 * import nyancat from './animation/nyancat';
 *
 * // Play intro, then continue with main CLI
 * await nyancat.startIntroAnimation();
 * console.log('Main CLI output...');
 *
 * // Or show loading animation during async work
 * const stop = nyancat.startLoadingAnimation();
 * await someTask();
 * stop(); // Animation stops and clears
 * ```
 */

import { stdout, stderr } from 'process';

// ============================================================================
// ANSI Escape Codes
// ============================================================================

const ANSI = {
  clearScreen: '\u001B[2J',
  cursorHome: '\u001B[H',
  hideCursor: '\u001B[?25l',
  showCursor: '\u001B[?25h',
  reset: '\u001B[0m',
  bold: '\u001B[1m',
  dim: '\u001B[2m',
} as const;

// ============================================================================
// Color Palette (8-color palette for maximum compatibility)
// ============================================================================

const COLORS = {
  red: '\u001B[38;5;196m',
  orange: '\u001B[38;5;208m',
  yellow: '\u001B[38;5;226m',
  lime: '\u001B[38;5;118m',
  green: '\u001B[38;5;46m',
  cyan: '\u001B[38;5;51m',
  blue: '\u001B[38;5;21m',
  magenta: '\u001B[38;5;201m',
  white: '\u001B[38;5;255m',
  gray: '\u001B[38;5;240m',
} as const;

// Rainbow trail colors
const RAINBOW = [
  COLORS.red,
  COLORS.orange,
  COLORS.yellow,
  COLORS.lime,
  COLORS.cyan,
  COLORS.blue,
  COLORS.magenta,
] as const;

// ============================================================================
// Configuration Types
// ============================================================================

interface NyanCatOptions {
  /** Delay between frames in milliseconds (default: 80) */
  frameDelayMs?: number;
  /** How long intro animation displays before auto-clearing (default: 1800ms) */
  introDurationMs?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Animation State
// ============================================================================

interface AnimationState {
  isRunning: boolean;
  startTime: number;
  frameIndex: number;
  intervalId: NodeJS.Timeout | null;
}

// ============================================================================
// NyanCat Animator Class
// ============================================================================

class NyanCatAnimator {
  private readonly frameDelayMs: number;
  private readonly introDurationMs: number;
  private readonly debug: boolean;
  private state: AnimationState = {
    isRunning: false,
    startTime: 0,
    frameIndex: 0,
    intervalId: null,
  };

  constructor(options: NyanCatOptions = {}) {
    this.frameDelayMs = options.frameDelayMs ?? 80;
    this.introDurationMs = options.introDurationMs ?? 1800;
    this.debug = options.debug ?? false;
  }

  /**
   * Get terminal dimensions
   */
  private getTerminalWidth(): number {
    return stdout.columns ?? 80;
  }

  private getTerminalHeight(): number {
    return stdout.rows ?? 24;
  }

  /**
   * Log debug messages to stderr (doesn't pollute stdout)
   */
  private log(msg: string): void {
    if (this.debug) {
      stderr.write(`[nyancat] ${msg}\n`);
    }
  }

  /**
   * Get Nyan Cat ASCII art frames (2 walking frames for animation)
   */
  private getCatFrames(): string[][] {
    return [
      // Frame 1
      [
        '|\\_/|',
        '(= ^ =)',
        '">💕<"',
        '  / \\',
      ],
      // Frame 2
      [
        '| \\_ _|',
        "(o  ^ o)",
        '"💕>"',
        '  \\ /',
      ],
    ];
  }

  /**
   * Generate rainbow trail segment
   */
  private getRainbowTrail(
    startX: number,
    length: number,
    frameNum: number
  ): Array<{ x: number; char: string; color: string }> {
    const trail: Array<{ x: number; char: string; color: string }> = [];
    for (let i = 0; i < length; i++) {
      const x = startX - i * 2;
      const colorIdx = (frameNum + i) % RAINBOW.length;
      trail.push({
        x,
        char: '~',
        color: RAINBOW[colorIdx],
      });
    }
    return trail;
  }

  /**
   * Generate starfield background
   */
  private generateStarfield(frameNum: number): string[][] {
    const width = this.getTerminalWidth();
    const height = this.getTerminalHeight();
    const grid: string[][] = [];

    for (let y = 0; y < height; y++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        // Pseudo-random star placement using a hash function
        const hash = ((x * 73 + y * 97 + frameNum * 11) ^ 0x9e3779b1) >>> 0;
        const rand = (hash % 100) / 100;

        if (rand < 0.02) {
          row.push(COLORS.white + '✦' + ANSI.reset);
        } else if (rand < 0.05) {
          row.push('·');
        } else {
          row.push(' ');
        }
      }
      grid.push(row);
    }

    return grid;
  }

  /**
   * Render a single animation frame
   */
  private renderFrame(frameNum: number): void {
    const width = this.getTerminalWidth();
    const height = this.getTerminalHeight();

    // Initialize screen with starfield
    const screen = this.generateStarfield(frameNum);

    // Calculate Nyan Cat's position (travels left to right, wraps around)
    const catSpeed = 2; // pixels per frame
    const catX = ((frameNum * catSpeed) % (width + 30)) - 15;
    const catYCenter = Math.floor(height / 2) - 2;

    // Get current cat frame (alternates for walking effect)
    const catFrames = this.getCatFrames();
    const catFrame =
      catFrames[Math.floor((frameNum / 4) % catFrames.length)] ?? catFrames[0];

    // Draw rainbow trail behind cat
    const trail = this.getRainbowTrail(catX, 8, frameNum);
    for (const segment of trail) {
      const trailY = catYCenter + Math.floor(Math.random() * 3) - 1;
      if (
        segment.x >= 0 &&
        segment.x < width &&
        trailY >= 0 &&
        trailY < height
      ) {
        screen[trailY][segment.x] =
          segment.color + segment.char + ANSI.reset;
      }
    }

    // Draw cat body
    for (let lineIdx = 0; lineIdx < catFrame.length; lineIdx++) {
      const catLine = catFrame[lineIdx];
      const screenY = catYCenter + lineIdx;

      if (screenY >= 0 && screenY < height && catX >= 0 && catX < width) {
        const catLineLen = catLine.length;
        const startX = Math.max(0, Math.min(catX, width - catLineLen));

        // Paint the cat in yellow
        for (let i = 0; i < catLineLen; i++) {
          const screenX = startX + i;
          if (screenX < width) {
            const char = catLine[i];
            if (char !== ' ') {
              // Use emoji if it's an emoji, otherwise color it
              if (char === '💕') {
                screen[screenY][screenX] = char;
              } else {
                screen[screenY][screenX] =
                  COLORS.yellow + char + ANSI.reset;
              }
            }
          }
        }
      }
    }

    // Write frame to stdout
    stdout.write(ANSI.cursorHome);

    for (let y = 0; y < Math.min(height, screen.length); y++) {
      const line = (screen[y] ?? []).join('');
      stdout.write(line);

      if (y < Math.min(height, screen.length) - 1) {
        stdout.write('\n');
      }
    }
  }

  /**
   * Cleanup: restore terminal state
   */
  private cleanup(): void {
    this.log('Cleaning up animation');

    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }

    this.state.isRunning = false;

    // Restore cursor and clear screen
    stdout.write(ANSI.showCursor);
    stdout.write(ANSI.clearScreen);
    stdout.write(ANSI.cursorHome);
  }

  /**
   * Setup signal handlers for graceful termination
   */
  private setupSignalHandlers(): () => void {
    const sigintHandler = (): void => {
      this.log('Received SIGINT');
      this.cleanup();
      process.exit(0);
    };

    const errorHandler = (error: Error | string): void => {
      this.log(`Caught error: ${error instanceof Error ? error.message : String(error)}`);
      this.cleanup();
      const message = error instanceof Error ? error.message : String(error);
      stderr.write(`\nUnexpected error: ${message}\n`);
      process.exit(1);
    };

    process.on('SIGINT', sigintHandler);
    process.on('uncaughtException', errorHandler);
    process.on('unhandledRejection', (reason) => {
      errorHandler(reason instanceof Error ? reason : new Error(String(reason)));
    });

    // Return cleanup function to remove handlers
    return (): void => {
      process.removeListener('SIGINT', sigintHandler);
      process.removeListener('uncaughtException', errorHandler);
      process.removeListener('unhandledRejection', errorHandler);
    };
  }

  /**
   * Start intro animation: plays for fixed duration, then clears and resolves
   *
   * @throws Will rethrow any uncaught errors that occur during animation
   */
  async startIntroAnimation(): Promise<void> {
    if (this.state.isRunning) {
      this.log('Animation already running, skipping intro');
      return;
    }

    this.log('Starting intro animation');
    this.state.isRunning = true;
    this.state.startTime = Date.now();
    this.state.frameIndex = 0;

    const removeSignalHandlers = this.setupSignalHandlers();

    // Prepare terminal
    stdout.write(ANSI.hideCursor);
    stdout.write(ANSI.clearScreen);
    stdout.write(ANSI.cursorHome);

    return new Promise((resolve, reject) => {
      this.state.intervalId = setInterval(() => {
        try {
          const elapsed = Date.now() - this.state.startTime;

          // Check if intro duration has elapsed
          if (elapsed >= this.introDurationMs) {
            this.log(
              `Intro complete after ${elapsed}ms, cleaning up`
            );
            this.cleanup();
            removeSignalHandlers();
            resolve();
            return;
          }

          // Render frame
          this.renderFrame(this.state.frameIndex);
          this.state.frameIndex++;
        } catch (error) {
          this.cleanup();
          removeSignalHandlers();
          reject(error);
        }
      }, this.frameDelayMs);
    });
  }

  /**
   * Start loading animation: loops continuously until stop() is called
   *
   * @returns A function to call when you want to stop the animation
   *
   * @example
   * ```typescript
   * const stop = nyancat.startLoadingAnimation();
   * await myAsyncTask();
   * stop(); // Cleans up and clears screen
   * ```
   */
  startLoadingAnimation(): () => void {
    if (this.state.isRunning) {
      this.log('Animation already running, returning no-op stop function');
      return () => {
        // No-op if already running
      };
    }

    this.log('Starting loading animation');
    this.state.isRunning = true;
    this.state.startTime = Date.now();
    this.state.frameIndex = 0;

    const removeSignalHandlers = this.setupSignalHandlers();

    // Prepare terminal
    stdout.write(ANSI.hideCursor);
    stdout.write(ANSI.clearScreen);
    stdout.write(ANSI.cursorHome);

    // Start animation loop
    this.state.intervalId = setInterval(() => {
      try {
        this.renderFrame(this.state.frameIndex);
        this.state.frameIndex++;
      } catch (error) {
        this.cleanup();
        removeSignalHandlers();
        stderr.write(
          `Error rendering frame: ${error instanceof Error ? error.message : String(error)}\n`
        );
      }
    }, this.frameDelayMs);

    // Return stop function
    return (): void => {
      this.log('Stop called, cleaning up loading animation');
      removeSignalHandlers();
      this.cleanup();
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

/**
 * Default singleton instance with standard options
 */
const nyancat = new NyanCatAnimator();

export default nyancat;
export { NyanCatAnimator, NyanCatOptions, COLORS, RAINBOW, ANSI };

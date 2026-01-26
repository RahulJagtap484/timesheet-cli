import type { GlobalOptions, OutputMode, ColumnDef } from '../types';
import { getConfig } from '../config';

/**
 * Output formatter interface
 */
export interface OutputFormatter {
  /**
   * Format a single value for output
   */
  format<T>(data: T): string;

  /**
   * Format an array as a table
   */
  formatTable<T extends object>(
    rows: T[],
    columns: ColumnDef<T>[]
  ): string;

  /**
   * Format a key-value object
   */
  formatKeyValue(data: Record<string, unknown>): string;

  /**
   * Format a success message
   */
  formatSuccess(message: string): string;

  /**
   * Format an error message
   */
  formatError(message: string): string;

  /**
   * Format a warning message
   */
  formatWarning(message: string): string;

  /**
   * Format an info message
   */
  formatInfo(message: string): string;

  /**
   * Format a header/title
   */
  formatHeader(title: string): string;

  /**
   * Format a hint/help message
   */
  formatHint(message: string): string;

  /**
   * Get the output mode
   */
  mode: OutputMode;
}

/**
 * Detect output mode based on options and environment
 */
export function detectOutputMode(options: GlobalOptions): OutputMode {
  // Explicit JSON flag takes precedence
  if (options.json) {
    return 'json';
  }

  // If not a TTY, use pipe mode
  if (!process.stdout.isTTY) {
    return 'pipe';
  }

  // Default to human-readable
  return 'human';
}

/**
 * Check if colors should be enabled
 */
export function shouldUseColors(options: GlobalOptions): boolean {
  // Explicit no-color flag
  if (options.color === false) {
    return false;
  }

  // NO_COLOR environment variable (standard)
  if (process.env.NO_COLOR !== undefined) {
    return false;
  }

  // FORCE_COLOR environment variable
  if (process.env.FORCE_COLOR !== undefined) {
    return true;
  }

  // Check config
  const configColors = getConfig('colors');
  if (!configColors) {
    return false;
  }

  // Default: colors if TTY
  return process.stdout.isTTY === true;
}

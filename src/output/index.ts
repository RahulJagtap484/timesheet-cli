import type { GlobalOptions } from '../types/index.js';
import {
  type OutputFormatter,
  detectOutputMode,
  shouldUseColors,
} from './formatter.js';
import { HumanFormatter } from './human.js';
import { JsonFormatter } from './json.js';
import { PipeFormatter } from './pipe.js';

export type { OutputFormatter } from './formatter.js';
export { detectOutputMode, shouldUseColors } from './formatter.js';
export { HumanFormatter } from './human.js';
export { JsonFormatter } from './json.js';
export { PipeFormatter } from './pipe.js';

/**
 * Create an output formatter based on options and environment
 */
export function createFormatter(options: GlobalOptions): OutputFormatter {
  const mode = detectOutputMode(options);

  switch (mode) {
    case 'json':
      return new JsonFormatter();
    case 'pipe':
      return new PipeFormatter();
    case 'human':
    default:
      return new HumanFormatter(shouldUseColors(options));
  }
}

/**
 * Print formatted output to stdout
 */
export function output(formatter: OutputFormatter, data: unknown): void {
  const formatted =
    typeof data === 'string' ? data : formatter.format(data);
  if (formatted) {
    console.log(formatted);
  }
}

/**
 * Print a newline
 */
export function newline(): void {
  console.log();
}

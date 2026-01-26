import type { OutputFormatter } from './formatter.js';
import type { ColumnDef } from '../types/index.js';

/**
 * JSON output formatter for machine-readable output
 */
export class JsonFormatter implements OutputFormatter {
  readonly mode = 'json' as const;

  format<T>(data: T): string {
    return JSON.stringify(data, null, 2);
  }

  formatTable<T extends object>(
    rows: T[],
    _columns: ColumnDef<T>[]
  ): string {
    return JSON.stringify(rows, null, 2);
  }

  formatKeyValue(data: Record<string, unknown>): string {
    return JSON.stringify(data, null, 2);
  }

  formatSuccess(message: string): string {
    return JSON.stringify({ success: true, message }, null, 2);
  }

  formatError(message: string): string {
    return JSON.stringify({ success: false, error: message }, null, 2);
  }

  formatWarning(message: string): string {
    return JSON.stringify({ warning: message }, null, 2);
  }

  formatInfo(message: string): string {
    return JSON.stringify({ info: message }, null, 2);
  }

  formatHeader(_title: string): string {
    // Headers don't make sense in JSON mode
    return '';
  }

  formatHint(_message: string): string {
    // Hints don't make sense in JSON mode
    return '';
  }
}

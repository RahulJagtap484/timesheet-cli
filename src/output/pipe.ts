import type { OutputFormatter } from './formatter.js';
import type { ColumnDef } from '../types/index.js';

/**
 * Pipe-friendly output formatter with tab-separated values
 */
export class PipeFormatter implements OutputFormatter {
  readonly mode = 'pipe' as const;

  format<T>(data: T): string {
    if (data === null || data === undefined) {
      return '';
    }

    if (typeof data === 'object') {
      return JSON.stringify(data);
    }

    return String(data);
  }

  formatTable<T extends object>(
    rows: T[],
    columns: ColumnDef<T>[]
  ): string {
    if (rows.length === 0) {
      return '';
    }

    const lines: string[] = [];

    for (const row of rows) {
      const values = columns.map((col) => {
        const value = row[col.key as keyof T];
        if (col.format) {
          return col.format(value, row);
        }
        return this.formatValue(value);
      });
      lines.push(values.join('\t'));
    }

    return lines.join('\n');
  }

  formatKeyValue(data: Record<string, unknown>): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      lines.push(`${key}\t${this.formatValue(value)}`);
    }

    return lines.join('\n');
  }

  formatSuccess(message: string): string {
    return `OK\t${message}`;
  }

  formatError(message: string): string {
    return `ERROR\t${message}`;
  }

  formatWarning(message: string): string {
    return `WARN\t${message}`;
  }

  formatInfo(message: string): string {
    return `INFO\t${message}`;
  }

  formatHeader(_title: string): string {
    // Headers are not included in pipe mode
    return '';
  }

  formatHint(_message: string): string {
    // Hints are not included in pipe mode
    return '';
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.join(',');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    // Escape tabs and newlines in string values
    return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
  }
}

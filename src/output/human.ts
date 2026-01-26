import chalk from 'chalk';
import Table from 'cli-table3';
import type { OutputFormatter } from './formatter.js';
import type { ColumnDef } from '../types/index.js';

/**
 * Human-readable output formatter with colors and tables
 */
export class HumanFormatter implements OutputFormatter {
  readonly mode = 'human' as const;
  private readonly useColors: boolean;

  constructor(useColors = true) {
    this.useColors = useColors;
  }

  private color(text: string, colorFn: (text: string) => string): string {
    return this.useColors ? colorFn(text) : text;
  }

  format<T>(data: T): string {
    if (data === null || data === undefined) {
      return this.color('-', chalk.dim);
    }

    if (typeof data === 'boolean') {
      return data
        ? this.color('Yes', chalk.green)
        : this.color('No', chalk.red);
    }

    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }

    return String(data);
  }

  formatTable<T extends object>(
    rows: T[],
    columns: ColumnDef<T>[]
  ): string {
    if (rows.length === 0) {
      return this.color('No items found.', chalk.dim);
    }

    const table = new Table({
      head: columns.map((c) =>
        this.useColors ? chalk.bold.cyan(c.header) : c.header
      ),
      style: {
        head: [],
        border: this.useColors ? ['dim'] : [],
      },
      colWidths: columns.map((c) => c.width ?? null),
      colAligns: columns.map((c) => c.align || 'left'),
    });

    for (const row of rows) {
      const rowData = columns.map((col) => {
        const value = row[col.key as keyof T];
        if (col.format) {
          return col.format(value, row);
        }
        return this.formatValue(value);
      });
      table.push(rowData);
    }

    return table.toString();
  }

  formatKeyValue(data: Record<string, unknown>): string {
    const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));
    const lines: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      const paddedKey = key.padEnd(maxKeyLength);
      const formattedKey = this.useColors
        ? chalk.bold(paddedKey)
        : paddedKey;
      const formattedValue = this.formatValue(value);
      lines.push(`  ${formattedKey}  ${formattedValue}`);
    }

    return lines.join('\n');
  }

  formatSuccess(message: string): string {
    const icon = this.useColors ? chalk.green('✓') : '✓';
    return `${icon} ${message}`;
  }

  formatError(message: string): string {
    const icon = this.useColors ? chalk.red('✗') : '✗';
    const text = this.useColors ? chalk.red(message) : message;
    return `${icon} ${text}`;
  }

  formatWarning(message: string): string {
    const icon = this.useColors ? chalk.yellow('⚠') : '⚠';
    const text = this.useColors ? chalk.yellow(message) : message;
    return `${icon} ${text}`;
  }

  formatInfo(message: string): string {
    const icon = this.useColors ? chalk.blue('ℹ') : 'ℹ';
    return `${icon} ${message}`;
  }

  formatHeader(title: string): string {
    return this.useColors ? chalk.bold.underline(title) : title;
  }

  formatHint(message: string): string {
    return this.useColors ? chalk.dim(message) : message;
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return this.color('-', chalk.dim);
    }

    if (typeof value === 'boolean') {
      return value
        ? this.color('Yes', chalk.green)
        : this.color('No', chalk.red);
    }

    if (value instanceof Date) {
      return value.toLocaleString();
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return this.color('-', chalk.dim);
      }
      return value.join(', ');
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Format a status indicator
   */
  formatStatus(
    status: 'running' | 'paused' | 'stopped' | 'active' | 'inactive' | string
  ): string {
    const statusMap: Record<string, { icon: string; color: typeof chalk.green }> = {
      running: { icon: '●', color: chalk.green },
      active: { icon: '●', color: chalk.green },
      paused: { icon: '◐', color: chalk.yellow },
      stopped: { icon: '○', color: chalk.dim },
      inactive: { icon: '○', color: chalk.dim },
    };

    const config = statusMap[status.toLowerCase()] || {
      icon: '●',
      color: chalk.white,
    };

    const text = `${config.icon} ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    return this.useColors ? config.color(text) : text;
  }
}

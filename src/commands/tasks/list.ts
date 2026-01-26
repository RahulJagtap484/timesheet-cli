import type { Command } from 'commander';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner, formatDurationSeconds } from '../../utils/index.js';
import { getConfig } from '../../config/index.js';
import type { GlobalOptions, ColumnDef } from '../../types/index.js';
import type { Task } from '@timesheet/sdk';

export function registerTasksListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List tasks')
    .option('-p, --project <project-id>', 'Filter by project ID')
    .option(
      '-s, --start-date <date>',
      'Start date (YYYY-MM-DD, default: 7 days ago)'
    )
    .option('-e, --end-date <date>', 'End date (YYYY-MM-DD, default: today)')
    .option('--today', 'Show tasks from today only')
    .option('-l, --limit <number>', 'Limit results', '20')
    .action(
      async (
        options: {
          project?: string;
          startDate?: string;
          endDate?: string;
          today?: boolean;
          limit: string;
        },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        spinner.start('Loading tasks...');

        const limit = parseInt(options.limit, 10) || getConfig('paginationLimit');

        // Calculate date range
        let startDate: Date;
        let endDate: Date;

        if (options.today) {
          startDate = startOfDay(new Date());
          endDate = endOfDay(new Date());
        } else {
          startDate = options.startDate
            ? new Date(options.startDate)
            : subDays(new Date(), 7);
          endDate = options.endDate ? new Date(options.endDate) : new Date();
        }

        const dateFormat = 'yyyy-MM-dd';

        const page = await client.tasks.search({
          projectId: options.project,
          startDate: format(startDate, dateFormat),
          endDate: format(endDate, dateFormat),
          limit,
        });

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, page.items);
          return;
        }

        if (page.items.length === 0) {
          output(formatter, formatter.formatInfo('No tasks found.'));
          return;
        }

        const columns: ColumnDef<Task>[] = [
          { key: 'id', header: 'ID', width: 36 },
          {
            key: 'startDateTime',
            header: 'Date',
            width: 12,
            format: (v) => {
              if (!v) return '-';
              return format(new Date(v as string), 'yyyy-MM-dd');
            },
          },
          {
            key: 'project',
            header: 'Project',
            width: 20,
            format: (v) => {
              const proj = v as { title?: string } | undefined;
              return proj?.title || '-';
            },
          },
          {
            key: 'duration',
            header: 'Duration',
            width: 10,
            format: (v) => formatDurationSeconds((v as number) || 0),
          },
          {
            key: 'description',
            header: 'Description',
            width: 30,
            format: (v) => {
              const desc = (v as string) || '-';
              return desc.length > 27 ? desc.substring(0, 27) + '...' : desc;
            },
          },
        ];

        output(formatter, formatter.formatTable(page.items, columns));
        newline();
        output(
          formatter,
          formatter.formatHint(`Showing ${page.items.length} tasks.`)
        );
      }
    );
}

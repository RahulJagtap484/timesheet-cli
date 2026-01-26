import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner, formatDurationSeconds } from '../../utils/index.js';
import { getConfig } from '../../config/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTasksCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a new task entry')
    .option('-p, --project <project-id>', 'Project ID')
    .option('-d, --description <text>', 'Task description')
    .option(
      '-s, --start <datetime>',
      'Start datetime (ISO 8601 or YYYY-MM-DD HH:mm)'
    )
    .option(
      '-e, --end <datetime>',
      'End datetime (ISO 8601 or YYYY-MM-DD HH:mm)'
    )
    .option('--billable', 'Mark as billable')
    .option('--no-billable', 'Mark as not billable')
    .option('-l, --location <location>', 'Location')
    .action(
      async (
        options: {
          project?: string;
          description?: string;
          start?: string;
          end?: string;
          billable?: boolean;
          location?: string;
        },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        const projectId = options.project || getConfig('defaultProjectId');

        if (!projectId) {
          output(
            formatter,
            formatter.formatError(
              'Project ID is required. Use -p or set a default project.'
            )
          );
          process.exit(2);
        }

        if (!options.start) {
          output(
            formatter,
            formatter.formatError('Start time is required. Use -s or --start.')
          );
          process.exit(2);
        }

        spinner.start('Creating task...');

        const task = await client.tasks.create({
          projectId,
          description: options.description,
          startDateTime: options.start,
          endDateTime: options.end,
          billable: options.billable,
          location: options.location,
        });

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, task);
          return;
        }

        if (formatter.mode === 'pipe') {
          output(
            formatter,
            `created\t${task.id}\t${task.project?.title || ''}\t${task.duration || 0}`
          );
          return;
        }

        output(formatter, formatter.formatSuccess('Task created!'));
        newline();

        output(
          formatter,
          formatter.formatKeyValue({
            ID: task.id,
            Project: task.project?.title || projectId,
            Duration: formatDurationSeconds(task.duration || 0),
          })
        );
        newline();
        output(
          formatter,
          formatter.formatHint(`View task: timesheet tasks show ${task.id}`)
        );
      }
    );
}

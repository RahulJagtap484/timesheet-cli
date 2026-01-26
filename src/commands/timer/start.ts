import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import { getConfig } from '../../config/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTimerStartCommand(parent: Command): void {
  parent
    .command('start')
    .description('Start the timer for a project')
    .argument('[project-id]', 'Project ID (uses default if not specified)')
    .option('-d, --description <text>', 'Task description')
    .option('--billable', 'Mark as billable')
    .option('--no-billable', 'Mark as not billable')
    .action(
      async (
        projectId: string | undefined,
        options: { description?: string; billable?: boolean },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        // Use default project if not specified
        const resolvedProjectId = projectId || getConfig('defaultProjectId');

        if (!resolvedProjectId) {
          output(
            formatter,
            formatter.formatError(
              'Project ID is required. Specify a project ID or set a default.'
            )
          );
          newline();
          output(
            formatter,
            formatter.formatHint(
              'Set default: timesheet config set defaultProjectId <id>'
            )
          );
          process.exit(2);
        }

        spinner.start('Starting timer...');

        let timer = await client.timer.start({
          projectId: resolvedProjectId,
        });

        // Update timer with description and billable if provided
        if (options.description !== undefined || options.billable !== undefined) {
          timer = await client.timer.update({
            description: options.description,
            billable: options.billable,
          });
        }

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, timer);
          return;
        }

        if (formatter.mode === 'pipe') {
          output(
            formatter,
            `started\t${timer.task?.project?.title || resolvedProjectId}\t${timer.task?.startDateTime || ''}`
          );
          return;
        }

        output(formatter, formatter.formatSuccess('Timer started!'));
        newline();

        const data: Record<string, string> = {
          Project: timer.task?.project?.title || resolvedProjectId,
        };

        if (options.description) {
          data['Description'] = options.description;
        }

        if (timer.task?.startDateTime) {
          data['Started'] = new Date(timer.task.startDateTime).toLocaleString();
        }

        output(formatter, formatter.formatKeyValue(data));
        newline();
        output(
          formatter,
          formatter.formatHint('Use "timesheet timer stop" to stop the timer.')
        );
      }
    );
}

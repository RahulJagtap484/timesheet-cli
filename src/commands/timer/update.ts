import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTimerUpdateCommand(parent: Command): void {
  parent
    .command('update')
    .description('Update the current running timer')
    .option('-d, --description <text>', 'Update task description')
    .option('--billable', 'Mark as billable')
    .option('--no-billable', 'Mark as not billable')
    .option('-l, --location <location>', 'Set location')
    .action(
      async (
        options: {
          description?: string;
          billable?: boolean;
          location?: string;
        },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        // Check if timer is running
        const currentTimer = await client.timer.get();
        if (currentTimer.status === 'stopped') {
          output(
            formatter,
            formatter.formatWarning('No timer is currently running.')
          );
          return;
        }

        // Build update request
        const updateData: {
          description?: string;
          billable?: boolean;
          location?: string;
        } = {};

        if (options.description !== undefined) {
          updateData.description = options.description;
        }
        if (options.billable !== undefined) {
          updateData.billable = options.billable;
        }
        if (options.location !== undefined) {
          updateData.location = options.location;
        }

        if (Object.keys(updateData).length === 0) {
          output(
            formatter,
            formatter.formatWarning(
              'No updates specified. Use --description, --billable, or --location.'
            )
          );
          return;
        }

        spinner.start('Updating timer...');

        const timer = await client.timer.update(updateData);

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, timer);
          return;
        }

        if (formatter.mode === 'pipe') {
          output(
            formatter,
            `updated\t${timer.task?.project?.title || ''}\t${timer.task?.description || ''}`
          );
          return;
        }

        output(formatter, formatter.formatSuccess('Timer updated.'));
        newline();

        const data: Record<string, string> = {
          Project: timer.task?.project?.title || 'Unknown',
        };

        if (timer.task?.description) {
          data['Description'] = timer.task.description;
        }

        if (timer.task?.billable !== undefined) {
          data['Billable'] = timer.task.billable ? 'Yes' : 'No';
        }

        output(formatter, formatter.formatKeyValue(data));
      }
    );
}

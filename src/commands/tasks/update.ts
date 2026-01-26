import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTasksUpdateCommand(parent: Command): void {
  parent
    .command('update')
    .description('Update a task')
    .argument('<id>', 'Task ID')
    .option('-d, --description <text>', 'Update description')
    .option('-s, --start <datetime>', 'Update start time')
    .option('-e, --end <datetime>', 'Update end time')
    .option('--billable', 'Mark as billable')
    .option('--no-billable', 'Mark as not billable')
    .option('--billed', 'Mark as billed')
    .option('--no-billed', 'Mark as not billed')
    .option('--paid', 'Mark as paid')
    .option('--no-paid', 'Mark as not paid')
    .option('-l, --location <location>', 'Update location')
    .action(
      async (
        id: string,
        options: {
          description?: string;
          start?: string;
          end?: string;
          billable?: boolean;
          billed?: boolean;
          paid?: boolean;
          location?: string;
        },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        // Build update data
        const updateData: {
          description?: string;
          startDateTime?: string;
          endDateTime?: string;
          billable?: boolean;
          billed?: boolean;
          paid?: boolean;
          location?: string;
        } = {};

        if (options.description !== undefined)
          updateData.description = options.description;
        if (options.start !== undefined)
          updateData.startDateTime = options.start;
        if (options.end !== undefined) updateData.endDateTime = options.end;
        if (options.billable !== undefined)
          updateData.billable = options.billable;
        if (options.billed !== undefined) updateData.billed = options.billed;
        if (options.paid !== undefined) updateData.paid = options.paid;
        if (options.location !== undefined)
          updateData.location = options.location;

        if (Object.keys(updateData).length === 0) {
          output(
            formatter,
            formatter.formatWarning('No updates specified.')
          );
          return;
        }

        spinner.start('Updating task...');

        const task = await client.tasks.update(id, updateData);

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, task);
          return;
        }

        if (formatter.mode === 'pipe') {
          output(formatter, `updated\t${task.id}`);
          return;
        }

        output(formatter, formatter.formatSuccess('Task updated.'));
        newline();

        output(
          formatter,
          formatter.formatKeyValue({
            ID: task.id,
            Project: task.project?.title || 'Unknown',
          })
        );
      }
    );
}

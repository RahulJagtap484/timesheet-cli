import type { Command } from 'commander';
import { format } from 'date-fns';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner, formatDurationSeconds } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTasksShowCommand(parent: Command): void {
  parent
    .command('show')
    .description('Show task details')
    .argument('<id>', 'Task ID')
    .action(async (id: string, _options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
      const client = await getClient(globalOptions);

      spinner.start('Loading task...');

      const task = await client.tasks.get(id);

      spinner.stop();

      if (globalOptions.json) {
        output(formatter, task);
        return;
      }

      if (formatter.mode === 'pipe') {
        output(
          formatter,
          `${task.id}\t${task.project?.title || ''}\t${task.duration || 0}\t${task.billable ? 'billable' : 'not-billable'}`
        );
        return;
      }

      output(formatter, formatter.formatHeader('Task Details'));
      newline();

      const data: Record<string, string> = {
        ID: task.id,
        Project: task.project?.title || 'Unknown',
        Duration: formatDurationSeconds(task.duration || 0),
        Billable: task.billable ? 'Yes' : 'No',
      };

      if (task.description) {
        data['Description'] = task.description;
      }

      if (task.startDateTime) {
        data['Start'] = format(
          new Date(task.startDateTime),
          'yyyy-MM-dd HH:mm'
        );
      }

      if (task.endDateTime) {
        data['End'] = format(new Date(task.endDateTime), 'yyyy-MM-dd HH:mm');
      }

      if (task.location) {
        data['Location'] = task.location;
      }

      if (task.tags && task.tags.length > 0) {
        data['Tags'] = task.tags.map((t) => t.name).join(', ');
      }

      if (task.billed !== undefined) {
        data['Billed'] = task.billed ? 'Yes' : 'No';
      }

      if (task.paid !== undefined) {
        data['Paid'] = task.paid ? 'Yes' : 'No';
      }

      output(formatter, formatter.formatKeyValue(data));
    });
}

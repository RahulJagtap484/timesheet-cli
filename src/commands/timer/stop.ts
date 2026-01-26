import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner, formatDurationSeconds } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTimerStopCommand(parent: Command): void {
  parent
    .command('stop')
    .description('Stop the timer and create a task')
    .option('-d, --description <text>', 'Update task description before stopping')
    .action(
      async (options: { description?: string }, command: Command) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        // First check if timer is running
        const currentTimer = await client.timer.get();
        if (currentTimer.status === 'stopped') {
          output(formatter, formatter.formatWarning('No timer is currently running.'));
          return;
        }

        // Update description if provided
        if (options.description) {
          await client.timer.update({ description: options.description });
        }

        spinner.start('Stopping timer...');

        const timer = await client.timer.stop();

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, timer);
          return;
        }

        if (formatter.mode === 'pipe') {
          const duration = timer.task?.duration || 0;
          output(
            formatter,
            `stopped\t${timer.task?.project?.title || ''}\t${duration}\t${timer.task?.id || ''}`
          );
          return;
        }

        output(formatter, formatter.formatSuccess('Timer stopped!'));
        newline();

        const data: Record<string, string> = {
          Project: timer.task?.project?.title || 'Unknown',
          Duration: formatDurationSeconds(timer.task?.duration || 0),
        };

        if (timer.task?.description) {
          data['Description'] = timer.task.description;
        }

        if (timer.task?.id) {
          data['Task ID'] = timer.task.id;
        }

        output(formatter, formatter.formatKeyValue(data));
        newline();
        output(
          formatter,
          formatter.formatHint(
            `View task: timesheet tasks show ${timer.task?.id || '<task-id>'}`
          )
        );
      }
    );
}

import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner, formatDuration } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTimerPauseCommand(parent: Command): void {
  parent
    .command('pause')
    .description('Pause the current timer')
    .action(async (_options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
      const client = await getClient(globalOptions);

      // Check current timer status
      const currentTimer = await client.timer.get();
      if (currentTimer.status === 'stopped') {
        output(
          formatter,
          formatter.formatWarning('No timer is currently running.')
        );
        return;
      }

      if (currentTimer.status === 'paused') {
        output(formatter, formatter.formatWarning('Timer is already paused.'));
        return;
      }

      spinner.start('Pausing timer...');

      const timer = await client.timer.pause();

      spinner.stop();

      if (globalOptions.json) {
        output(formatter, timer);
        return;
      }

      if (formatter.mode === 'pipe') {
        output(
          formatter,
          `paused\t${timer.task?.project?.title || ''}\t${timer.task?.duration || 0}`
        );
        return;
      }

      output(formatter, formatter.formatSuccess('Timer paused.'));
      newline();

      const duration = timer.task?.startDateTime
        ? Date.now() - new Date(timer.task.startDateTime).getTime()
        : 0;

      output(
        formatter,
        formatter.formatKeyValue({
          Project: timer.task?.project?.title || 'Unknown',
          Duration: formatDuration(duration),
        })
      );
      newline();
      output(
        formatter,
        formatter.formatHint('Use "timesheet timer resume" to resume.')
      );
    });
}

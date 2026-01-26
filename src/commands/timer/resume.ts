import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTimerResumeCommand(parent: Command): void {
  parent
    .command('resume')
    .description('Resume a paused timer')
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
        newline();
        output(
          formatter,
          formatter.formatHint(
            'Start a new timer with: timesheet timer start <project-id>'
          )
        );
        return;
      }

      if (currentTimer.status === 'running') {
        output(formatter, formatter.formatWarning('Timer is already running.'));
        return;
      }

      spinner.start('Resuming timer...');

      const timer = await client.timer.resume();

      spinner.stop();

      if (globalOptions.json) {
        output(formatter, timer);
        return;
      }

      if (formatter.mode === 'pipe') {
        output(
          formatter,
          `running\t${timer.task?.project?.title || ''}\t${timer.task?.startDateTime || ''}`
        );
        return;
      }

      output(formatter, formatter.formatSuccess('Timer resumed!'));
      newline();
      output(
        formatter,
        formatter.formatKeyValue({
          Project: timer.task?.project?.title || 'Unknown',
          Status: 'Running',
        })
      );
      newline();
      output(
        formatter,
        formatter.formatHint('Use "timesheet timer stop" to stop the timer.')
      );
    });
}

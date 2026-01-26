import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import {
  createFormatter,
  output,
  newline,
  HumanFormatter,
} from '../../output/index.js';
import { formatDuration, formatDurationPipe } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTimerStatusCommand(parent: Command): void {
  parent
    .command('status')
    .description('Show current timer status')
    .action(async (_options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const client = await getClient(globalOptions);

      const timer = await client.timer.get();

      if (globalOptions.json) {
        output(formatter, timer);
        return;
      }

      // Pipe mode
      if (formatter.mode === 'pipe') {
        if (timer.status === 'stopped') {
          output(formatter, 'stopped\t\t0\t');
        } else {
          const project = timer.task?.project?.title || '';
          const startTime = timer.task?.startDateTime || '';
          const duration = timer.task?.startDateTime
            ? Date.now() - new Date(timer.task.startDateTime).getTime()
            : 0;
          output(
            formatter,
            `${timer.status}\t${project}\t${formatDurationPipe(duration)}\t${startTime}`
          );
        }
        return;
      }

      // Human mode
      output(formatter, formatter.formatHeader('Timer Status'));
      newline();

      if (timer.status === 'stopped') {
        output(formatter, formatter.formatInfo('No timer running'));
        newline();
        output(
          formatter,
          formatter.formatHint(
            'Start a timer with: timesheet timer start <project-id>'
          )
        );
        return;
      }

      const duration = timer.task?.startDateTime
        ? Date.now() - new Date(timer.task.startDateTime).getTime()
        : 0;

      const humanFormatter = formatter as HumanFormatter;
      const statusText = humanFormatter.formatStatus?.(timer.status) || timer.status;

      const data: Record<string, string> = {
        Status: statusText,
        Project: timer.task?.project?.title || 'Unknown',
        Duration: formatDuration(duration),
      };

      if (timer.task?.description) {
        data['Description'] = timer.task.description;
      }

      if (timer.task?.startDateTime) {
        const startDate = new Date(timer.task.startDateTime);
        data['Started'] = startDate.toLocaleString();
      }

      output(formatter, formatter.formatKeyValue(data));
      newline();

      if (timer.status === 'running') {
        output(
          formatter,
          formatter.formatHint('Use "timesheet timer stop" to stop the timer.')
        );
      } else if (timer.status === 'paused') {
        output(
          formatter,
          formatter.formatHint(
            'Use "timesheet timer resume" to resume the timer.'
          )
        );
      }
    });
}

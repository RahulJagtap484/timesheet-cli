import type { Command } from 'commander';
import inquirer from 'inquirer';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import { getConfig } from '../../config/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerTasksDeleteCommand(parent: Command): void {
  parent
    .command('delete')
    .description('Delete a task')
    .argument('<id>', 'Task ID')
    .option('-f, --force', 'Skip confirmation prompt')
    .action(
      async (id: string, options: { force?: boolean }, command: Command) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        // Confirm deletion unless forced
        if (
          !options.force &&
          getConfig('confirmDeletes') &&
          process.stdout.isTTY &&
          !globalOptions.json
        ) {
          const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to delete task ${id}?`,
              default: false,
            },
          ]);

          if (!confirm) {
            output(formatter, formatter.formatInfo('Deletion cancelled.'));
            return;
          }
        }

        spinner.start('Deleting task...');

        await client.tasks.delete(id);

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, { deleted: true, id });
          return;
        }

        if (formatter.mode === 'pipe') {
          output(formatter, `deleted\t${id}`);
          return;
        }

        output(formatter, formatter.formatSuccess('Task deleted.'));
      }
    );
}

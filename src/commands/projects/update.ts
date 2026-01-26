import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerProjectsUpdateCommand(parent: Command): void {
  parent
    .command('update')
    .description('Update a project')
    .argument('<id>', 'Project ID')
    .option('-t, --title <title>', 'New title')
    .option('-d, --description <text>', 'New description')
    .option('-c, --color <number>', 'Color code (0-15)')
    .option('--archive', 'Archive the project')
    .option('--unarchive', 'Unarchive the project')
    .option('--billable', 'Set default billable to true')
    .option('--no-billable', 'Set default billable to false')
    .action(
      async (
        id: string,
        options: {
          title?: string;
          description?: string;
          color?: string;
          archive?: boolean;
          unarchive?: boolean;
          billable?: boolean;
        },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        // Build update data
        const updateData: {
          title?: string;
          description?: string;
          color?: number;
          archived?: boolean;
          taskDefaultBillable?: boolean;
        } = {};

        if (options.title) updateData.title = options.title;
        if (options.description) updateData.description = options.description;
        if (options.color) updateData.color = parseInt(options.color, 10);
        if (options.archive) updateData.archived = true;
        if (options.unarchive) updateData.archived = false;
        if (options.billable !== undefined) {
          updateData.taskDefaultBillable = options.billable;
        }

        if (Object.keys(updateData).length === 0) {
          output(
            formatter,
            formatter.formatWarning('No updates specified.')
          );
          return;
        }

        spinner.start('Updating project...');

        const project = await client.projects.update(id, updateData);

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, project);
          return;
        }

        if (formatter.mode === 'pipe') {
          output(formatter, `updated\t${project.id}\t${project.title}`);
          return;
        }

        output(formatter, formatter.formatSuccess('Project updated.'));
        newline();

        output(
          formatter,
          formatter.formatKeyValue({
            ID: project.id,
            Title: project.title,
            Status: project.archived ? 'Inactive' : 'Active',
          })
        );
      }
    );
}

import { Command } from 'commander';
import inquirer from 'inquirer';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import { getConfig } from '../../config/index.js';
import type { GlobalOptions, ColumnDef } from '../../types/index.js';
import type { Tag } from '@timesheet/sdk';

export function registerTagsCommands(program: Command): void {
  const tags = program.command('tags').description('Tag management commands');

  // List tags
  tags
    .command('list')
    .description('List all tags')
    .action(async (_options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
      const client = await getClient(globalOptions);

      spinner.start('Loading tags...');

      const page = await client.tags.list();

      spinner.stop();

      if (globalOptions.json) {
        output(formatter, page.items);
        return;
      }

      if (page.items.length === 0) {
        output(formatter, formatter.formatInfo('No tags found.'));
        newline();
        output(
          formatter,
          formatter.formatHint(
            'Create a tag with: timesheet tags create "Tag Name"'
          )
        );
        return;
      }

      const columns: ColumnDef<Tag>[] = [
        { key: 'id', header: 'ID', width: 36 },
        { key: 'name', header: 'Name', width: 30 },
        {
          key: 'color',
          header: 'Color',
          width: 10,
          format: (v) => (v as number)?.toString() || '-',
        },
      ];

      output(formatter, formatter.formatTable(page.items, columns));
      newline();
      output(
        formatter,
        formatter.formatHint(`Showing ${page.items.length} tags.`)
      );
    });

  // Create tag
  tags
    .command('create')
    .description('Create a new tag')
    .argument('<name>', 'Tag name')
    .option('-c, --color <number>', 'Color code (0-15)')
    .action(
      async (
        name: string,
        options: { color?: string },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        spinner.start('Creating tag...');

        const tag = await client.tags.create({
          name,
          color: options.color ? parseInt(options.color, 10) : undefined,
        });

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, tag);
          return;
        }

        if (formatter.mode === 'pipe') {
          output(formatter, `created\t${tag.id}\t${tag.name}`);
          return;
        }

        output(formatter, formatter.formatSuccess('Tag created!'));
        newline();

        output(
          formatter,
          formatter.formatKeyValue({
            ID: tag.id,
            Name: tag.name,
          })
        );
      }
    );

  // Delete tag
  tags
    .command('delete')
    .description('Delete a tag')
    .argument('<id>', 'Tag ID')
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
              message: `Are you sure you want to delete tag ${id}?`,
              default: false,
            },
          ]);

          if (!confirm) {
            output(formatter, formatter.formatInfo('Deletion cancelled.'));
            return;
          }
        }

        spinner.start('Deleting tag...');

        await client.tags.delete(id);

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, { deleted: true, id });
          return;
        }

        if (formatter.mode === 'pipe') {
          output(formatter, `deleted\t${id}`);
          return;
        }

        output(formatter, formatter.formatSuccess('Tag deleted.'));
      }
    );
}

import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import { getConfig } from '../../config/index.js';
import type { GlobalOptions, ColumnDef } from '../../types/index.js';
import type { Project } from '@timesheet/sdk';

export function registerProjectsListCommand(parent: Command): void {
  parent
    .command('list')
    .description('List all projects')
    .option(
      '-s, --status <status>',
      'Filter by status (active, inactive, all)',
      'active'
    )
    .option('-t, --team <team-id>', 'Filter by team ID')
    .option('-l, --limit <number>', 'Limit results', '20')
    .action(
      async (
        options: { status: string; team?: string; limit: string },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        spinner.start('Loading projects...');

        const limit = parseInt(options.limit, 10) || getConfig('paginationLimit');

        const page = await client.projects.list({
          limit,
          // Note: SDK might have different filter parameters
        });

        // Filter by status if specified (client-side filtering)
        let projects = page.items;
        if (options.status !== 'all') {
          const isActive = options.status === 'active';
          projects = projects.filter((p) => !p.archived === isActive);
        }

        // Filter by team if specified
        if (options.team) {
          projects = projects.filter((p) => p.team?.id === options.team);
        }

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, projects);
          return;
        }

        if (projects.length === 0) {
          output(formatter, formatter.formatInfo('No projects found.'));
          newline();
          output(
            formatter,
            formatter.formatHint(
              'Create a project with: timesheet projects create "Project Name"'
            )
          );
          return;
        }

        const columns: ColumnDef<Project>[] = [
          { key: 'id', header: 'ID', width: 36 },
          { key: 'title', header: 'Title', width: 30 },
          {
            key: 'archived',
            header: 'Status',
            width: 10,
            format: (v) => (v ? 'Inactive' : 'Active'),
          },
          {
            key: 'taskDefaultBillable',
            header: 'Billable',
            width: 10,
            format: (v) => (v ? 'Yes' : 'No'),
          },
        ];

        output(formatter, formatter.formatTable(projects, columns));
        newline();
        output(
          formatter,
          formatter.formatHint(`Showing ${projects.length} projects.`)
        );
      }
    );
}

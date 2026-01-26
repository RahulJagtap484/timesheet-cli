import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import { getConfig } from '../../config/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerProjectsCreateCommand(parent: Command): void {
  parent
    .command('create')
    .description('Create a new project')
    .argument('<title>', 'Project title')
    .option('-d, --description <text>', 'Project description')
    .option('-t, --team <team-id>', 'Team ID')
    .option('-c, --color <number>', 'Color code (0-15)')
    .option('--billable', 'Set default billable to true')
    .option('--no-billable', 'Set default billable to false')
    .action(
      async (
        title: string,
        options: {
          description?: string;
          team?: string;
          color?: string;
          billable?: boolean;
        },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);
        const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
        const client = await getClient(globalOptions);

        spinner.start('Creating project...');

        const teamId = options.team || getConfig('defaultTeamId');

        const project = await client.projects.create({
          title,
          description: options.description,
          teamId,
          color: options.color ? parseInt(options.color, 10) : undefined,
          taskDefaultBillable: options.billable,
        });

        spinner.stop();

        if (globalOptions.json) {
          output(formatter, project);
          return;
        }

        if (formatter.mode === 'pipe') {
          output(formatter, `created\t${project.id}\t${project.title}`);
          return;
        }

        output(formatter, formatter.formatSuccess('Project created!'));
        newline();

        output(
          formatter,
          formatter.formatKeyValue({
            ID: project.id,
            Title: project.title,
            Status: 'Active',
          })
        );
        newline();
        output(
          formatter,
          formatter.formatHint(
            `Start timer: timesheet timer start ${project.id}`
          )
        );
      }
    );
}

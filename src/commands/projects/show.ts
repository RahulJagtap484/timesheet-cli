import type { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerProjectsShowCommand(parent: Command): void {
  parent
    .command('show')
    .description('Show project details')
    .argument('<id>', 'Project ID')
    .action(async (id: string, _options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
      const client = await getClient(globalOptions);

      spinner.start('Loading project...');

      const project = await client.projects.get(id);

      spinner.stop();

      if (globalOptions.json) {
        output(formatter, project);
        return;
      }

      if (formatter.mode === 'pipe') {
        output(
          formatter,
          `${project.id}\t${project.title}\t${project.archived ? 'inactive' : 'active'}\t${project.taskDefaultBillable ? 'billable' : 'not-billable'}`
        );
        return;
      }

      output(formatter, formatter.formatHeader('Project Details'));
      newline();

      const data: Record<string, string> = {
        ID: project.id,
        Title: project.title,
        Status: project.archived ? 'Inactive' : 'Active',
        'Default Billable': project.taskDefaultBillable ? 'Yes' : 'No',
      };

      if (project.description) {
        data['Description'] = project.description;
      }

      if (project.team?.id) {
        data['Team ID'] = project.team.id;
      }

      if (project.color !== undefined) {
        data['Color'] = project.color.toString();
      }

      if (project.created) {
        data['Created'] = new Date(project.created).toLocaleString();
      }

      output(formatter, formatter.formatKeyValue(data));
      newline();
      output(
        formatter,
        formatter.formatHint(
          `Start timer: timesheet timer start ${project.id}`
        )
      );
    });
}

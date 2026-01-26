import { Command } from 'commander';
import { registerProjectsListCommand } from './list.js';
import { registerProjectsShowCommand } from './show.js';
import { registerProjectsCreateCommand } from './create.js';
import { registerProjectsUpdateCommand } from './update.js';
import { registerProjectsDeleteCommand } from './delete.js';

export function registerProjectsCommands(program: Command): void {
  const projects = program
    .command('projects')
    .alias('p')
    .description('Project management commands');

  registerProjectsListCommand(projects);
  registerProjectsShowCommand(projects);
  registerProjectsCreateCommand(projects);
  registerProjectsUpdateCommand(projects);
  registerProjectsDeleteCommand(projects);
}

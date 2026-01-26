import { Command } from 'commander';
import { registerTasksListCommand } from './list.js';
import { registerTasksShowCommand } from './show.js';
import { registerTasksCreateCommand } from './create.js';
import { registerTasksUpdateCommand } from './update.js';
import { registerTasksDeleteCommand } from './delete.js';

export function registerTasksCommands(program: Command): void {
  const tasks = program
    .command('tasks')
    .alias('t')
    .description('Task management commands');

  registerTasksListCommand(tasks);
  registerTasksShowCommand(tasks);
  registerTasksCreateCommand(tasks);
  registerTasksUpdateCommand(tasks);
  registerTasksDeleteCommand(tasks);
}

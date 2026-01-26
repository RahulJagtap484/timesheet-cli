import type { Command } from 'commander';
import { registerAuthCommands } from './auth/index.js';
import { registerTimerCommands } from './timer/index.js';
import { registerProjectsCommands } from './projects/index.js';
import { registerTasksCommands } from './tasks/index.js';
import { registerTeamsCommands } from './teams/index.js';
import { registerTagsCommands } from './tags/index.js';
import { registerReportsCommands } from './reports/index.js';
import { registerProfileCommands } from './profile/index.js';
import { registerConfigCommands } from './config/index.js';

/**
 * Register all CLI commands
 */
export function registerCommands(program: Command): void {
  registerAuthCommands(program);
  registerTimerCommands(program);
  registerProjectsCommands(program);
  registerTasksCommands(program);
  registerTeamsCommands(program);
  registerTagsCommands(program);
  registerReportsCommands(program);
  registerProfileCommands(program);
  registerConfigCommands(program);
}

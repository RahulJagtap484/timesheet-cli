import { Command } from 'commander';
import { registerLoginCommand } from './login.js';
import { registerLogoutCommand } from './logout.js';
import { registerStatusCommand } from './status.js';
import { registerApiKeyCommand } from './apikey.js';

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command('auth')
    .description('Authentication commands');

  registerLoginCommand(auth);
  registerLogoutCommand(auth);
  registerStatusCommand(auth);
  registerApiKeyCommand(auth);
}

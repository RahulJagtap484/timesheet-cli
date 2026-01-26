import type { Command } from 'commander';
import { logout as performLogout, isAuthenticated } from '../../auth/index.js';
import { clearClient } from '../../sdk/index.js';
import { createFormatter, output } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerLogoutCommand(parent: Command): void {
  parent
    .command('logout')
    .description('Clear stored authentication credentials')
    .action(async (_options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const spinner = createSpinner(!globalOptions.quiet);

      // Check if authenticated
      if (!(await isAuthenticated())) {
        output(
          formatter,
          formatter.formatInfo('Not currently authenticated.')
        );
        return;
      }

      try {
        spinner.start('Logging out...');

        await performLogout();
        clearClient();

        spinner.succeed('Successfully logged out.');
      } catch (error) {
        spinner.fail('Logout failed');
        throw error;
      }
    });
}

import type {Command} from 'commander';
import {isAuthenticated, login as performLogin} from '../../auth/index.js';
import {createFormatter, newline, output} from '../../output';
import {createSpinner} from '../../utils';
import type {GlobalOptions} from '../../types';

export function registerLoginCommand(parent: Command): void {
    parent
        .command('login')
        .description('Authenticate with timesheet.io using OAuth 2.1')
        .option('--force', 'Force re-authentication even if already logged in')
        .action(async (options: { force?: boolean }, command: Command) => {
            const globalOptions = command.optsWithGlobals<GlobalOptions>();
            const formatter = createFormatter(globalOptions);
            const spinner = createSpinner(!globalOptions.quiet);

            // Check if already authenticated
            if (!options.force && (await isAuthenticated())) {
                output(
                    formatter,
                    formatter.formatWarning(
                        'Already authenticated. Use --force to re-authenticate.'
                    )
                );
                return;
            }

            try {
                spinner.start('Opening browser for authentication...');

                console.log(); // New line for browser message
                output(
                    formatter,
                    formatter.formatInfo(
                        'A browser window will open for you to log in.'
                    )
                );
                output(
                    formatter,
                    formatter.formatHint(
                        'If it doesn\'t open automatically, please check your browser.'
                    )
                );
                newline();

                spinner.update('Waiting for authentication...');

                await performLogin();

                spinner.succeed('Successfully authenticated!');
                newline();
                output(
                    formatter,
                    formatter.formatHint(
                        'You can now use timesheet CLI commands.'
                    )
                );
            } catch (error) {
                spinner.fail('Authentication failed');
                throw error;
            }
        });
}

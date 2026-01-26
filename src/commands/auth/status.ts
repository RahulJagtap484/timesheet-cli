import type { Command } from 'commander';
import { getAuthStatus, getStoredApiKey } from '../../auth/index.js';
import { getApiKey } from '../../config/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerStatusCommand(parent: Command): void {
  parent
    .command('status')
    .description('Show current authentication status')
    .action(async (_options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);

      const status = await getAuthStatus();
      const envApiKey = getApiKey();
      const storedApiKey = await getStoredApiKey();

      if (globalOptions.json) {
        output(formatter, {
          authenticated: status.authenticated || !!envApiKey || !!storedApiKey,
          method: envApiKey
            ? 'apikey_env'
            : storedApiKey
            ? 'apikey_stored'
            : status.method,
          expiresAt: status.expiresAt,
          clientId: status.clientId,
        });
        return;
      }

      output(formatter, formatter.formatHeader('Authentication Status'));
      newline();

      if (envApiKey) {
        output(
          formatter,
          formatter.formatKeyValue({
            Status: 'Authenticated',
            Method: 'API Key (environment variable)',
            'API Key': `${envApiKey.substring(0, 10)}...`,
          })
        );
      } else if (storedApiKey) {
        output(
          formatter,
          formatter.formatKeyValue({
            Status: 'Authenticated',
            Method: 'API Key (stored)',
            'API Key': `${storedApiKey.substring(0, 10)}...`,
          })
        );
      } else if (status.authenticated) {
        const data: Record<string, string> = {
          Status: 'Authenticated',
          Method: 'OAuth 2.1',
        };

        if (status.clientId) {
          data['Client ID'] = status.clientId;
        }

        if (status.expiresAt) {
          const expiresAt = new Date(status.expiresAt);
          const now = new Date();
          if (expiresAt > now) {
            const remaining = Math.round(
              (expiresAt.getTime() - now.getTime()) / 60000
            );
            data['Token Expires'] = `${expiresAt.toLocaleString()} (${remaining} minutes)`;
          } else {
            data['Token Expires'] = 'Expired (will refresh on next request)';
          }
        }

        output(formatter, formatter.formatKeyValue(data));
      } else {
        output(
          formatter,
          formatter.formatKeyValue({
            Status: 'Not authenticated',
          })
        );
        newline();
        output(
          formatter,
          formatter.formatHint(
            'Run "timesheet auth login" to authenticate with OAuth 2.1'
          )
        );
        output(
          formatter,
          formatter.formatHint(
            'Or set TIMESHEET_API_KEY environment variable'
          )
        );
      }
    });
}

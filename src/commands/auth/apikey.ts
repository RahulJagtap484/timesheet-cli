import type { Command } from 'commander';
import { storeApiKey, clearApiKey, getStoredApiKey } from '../../auth/index.js';
import { getApiKey } from '../../config/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerApiKeyCommand(parent: Command): void {
  parent
    .command('apikey')
    .description('Configure API key authentication')
    .option('--set <key>', 'Set the API key')
    .option('--clear', 'Clear the stored API key')
    .option('--show', 'Show the current API key (masked)')
    .action(
      async (
        options: { set?: string; clear?: boolean; show?: boolean },
        command: Command
      ) => {
        const globalOptions = command.optsWithGlobals<GlobalOptions>();
        const formatter = createFormatter(globalOptions);

        if (options.clear) {
          await clearApiKey();
          output(formatter, formatter.formatSuccess('API key cleared.'));
          return;
        }

        if (options.set) {
          // Validate API key format
          if (!options.set.startsWith('ts_')) {
            output(
              formatter,
              formatter.formatWarning(
                'API key should start with "ts_". Storing anyway.'
              )
            );
          }

          await storeApiKey(options.set);
          output(formatter, formatter.formatSuccess('API key stored securely.'));
          return;
        }

        // Show current API key status
        const envApiKey = getApiKey();
        const storedApiKey = await getStoredApiKey();

        if (globalOptions.json) {
          output(formatter, {
            hasEnvApiKey: !!envApiKey,
            hasStoredApiKey: !!storedApiKey,
            envApiKey: envApiKey ? `${envApiKey.substring(0, 10)}...` : null,
            storedApiKey: storedApiKey
              ? `${storedApiKey.substring(0, 10)}...`
              : null,
          });
          return;
        }

        output(formatter, formatter.formatHeader('API Key Configuration'));
        newline();

        if (envApiKey) {
          output(
            formatter,
            formatter.formatKeyValue({
              'Environment Variable': `${envApiKey.substring(0, 10)}... (TIMESHEET_API_KEY)`,
            })
          );
        }

        if (storedApiKey) {
          output(
            formatter,
            formatter.formatKeyValue({
              'Stored API Key': `${storedApiKey.substring(0, 10)}...`,
            })
          );
        }

        if (!envApiKey && !storedApiKey) {
          output(formatter, formatter.formatInfo('No API key configured.'));
          newline();
          output(
            formatter,
            formatter.formatHint(
              'Set an API key with: timesheet auth apikey --set YOUR_API_KEY'
            )
          );
          output(
            formatter,
            formatter.formatHint(
              'Or set TIMESHEET_API_KEY environment variable'
            )
          );
        } else if (envApiKey && storedApiKey) {
          newline();
          output(
            formatter,
            formatter.formatHint(
              'Note: Environment variable takes precedence over stored key.'
            )
          );
        }
      }
    );
}

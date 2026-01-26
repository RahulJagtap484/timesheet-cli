import { Command } from 'commander';
import { getClient } from '../../sdk/index.js';
import { createFormatter, output, newline } from '../../output/index.js';
import { createSpinner } from '../../utils/index.js';
import type { GlobalOptions } from '../../types/index.js';

export function registerProfileCommands(program: Command): void {
  const profile = program
    .command('profile')
    .description('Profile and settings commands');

  // Show profile
  profile
    .command('show')
    .description('Show user profile')
    .action(async (_options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
      const client = await getClient(globalOptions);

      spinner.start('Loading profile...');

      const userProfile = await client.profile.getProfile();

      spinner.stop();

      if (globalOptions.json) {
        output(formatter, userProfile);
        return;
      }

      if (formatter.mode === 'pipe') {
        output(
          formatter,
          `${userProfile.email}\t${userProfile.firstname || ''}\t${userProfile.lastname || ''}`
        );
        return;
      }

      output(formatter, formatter.formatHeader('User Profile'));
      newline();

      const data: Record<string, string> = {};

      if (userProfile.email) {
        data['Email'] = userProfile.email;
      }

      if (userProfile.firstname || userProfile.lastname) {
        data['Name'] = `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim();
      }

      output(formatter, formatter.formatKeyValue(data));
    });

  // Show/update settings
  profile
    .command('settings')
    .description('Show or update settings')
    .action(async (_options: object, command: Command) => {
      const globalOptions = command.optsWithGlobals<GlobalOptions>();
      const formatter = createFormatter(globalOptions);
      const spinner = createSpinner(!globalOptions.quiet && !globalOptions.json);
      const client = await getClient(globalOptions);

      spinner.start('Loading settings...');

      const settings = await client.settings.get();

      spinner.stop();

      if (globalOptions.json) {
        output(formatter, settings);
        return;
      }

      output(formatter, formatter.formatHeader('Settings'));
      newline();

      const data: Record<string, string> = {};

      if (settings.theme) {
        data['Theme'] = settings.theme;
      }

      if (settings.timezone) {
        data['Timezone'] = settings.timezone;
      }

      if (settings.language) {
        data['Language'] = settings.language;
      }

      if (settings.currency) {
        data['Currency'] = settings.currency;
      }

      if (settings.dateFormat) {
        data['Date Format'] = settings.dateFormat;
      }

      if (settings.timeFormat) {
        data['Time Format'] = settings.timeFormat;
      }

      if (settings.firstDay !== undefined) {
        const days = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        data['Week Starts'] = days[settings.firstDay] || 'Monday';
      }

      output(formatter, formatter.formatKeyValue(data));
    });
}

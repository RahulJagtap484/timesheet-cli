import { Command } from 'commander';
import { registerTimerStatusCommand } from './status.js';
import { registerTimerStartCommand } from './start.js';
import { registerTimerStopCommand } from './stop.js';
import { registerTimerPauseCommand } from './pause.js';
import { registerTimerResumeCommand } from './resume.js';
import { registerTimerUpdateCommand } from './update.js';

export function registerTimerCommands(program: Command): void {
  const timer = program
    .command('timer')
    .description('Timer commands for time tracking');

  registerTimerStatusCommand(timer);
  registerTimerStartCommand(timer);
  registerTimerStopCommand(timer);
  registerTimerPauseCommand(timer);
  registerTimerResumeCommand(timer);
  registerTimerUpdateCommand(timer);
}

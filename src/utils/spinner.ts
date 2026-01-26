import ora, { type Ora } from 'ora';

/**
 * Create and manage a spinner for long operations
 */
export class Spinner {
  private spinner: Ora | null = null;
  private readonly enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled && process.stdout.isTTY === true;
  }

  /**
   * Start the spinner with a message
   */
  start(message: string): void {
    if (!this.enabled) {
      return;
    }
    this.spinner = ora(message).start();
  }

  /**
   * Update the spinner message
   */
  update(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  /**
   * Stop the spinner with a success message
   */
  succeed(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner with a failure message
   */
  fail(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner with a warning message
   */
  warn(message?: string): void {
    if (this.spinner) {
      this.spinner.warn(message);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner with an info message
   */
  info(message?: string): void {
    if (this.spinner) {
      this.spinner.info(message);
      this.spinner = null;
    }
  }

  /**
   * Stop the spinner without changing the message
   */
  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

/**
 * Create a spinner instance
 */
export function createSpinner(enabled = true): Spinner {
  return new Spinner(enabled);
}

/**
 * Run an async operation with a spinner
 */
export async function withSpinner<T>(
  message: string,
  operation: () => Promise<T>,
  options: { enabled?: boolean; successMessage?: string } = {}
): Promise<T> {
  const spinner = createSpinner(options.enabled ?? true);
  spinner.start(message);

  try {
    const result = await operation();
    spinner.succeed(options.successMessage);
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

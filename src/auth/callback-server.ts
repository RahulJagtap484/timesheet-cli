import http from 'http';
import { URL } from 'url';
import type { OAuthCallbackResult } from '../types';
import { CLIError, ExitCode } from '../utils';

const CALLBACK_PATH = '/callback';
const LOGIN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * HTML page shown after successful authorization
 */
const SUCCESS_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Timesheet CLI - Login Successful</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #22c55e; margin-bottom: 16px; }
    p { color: #666; margin-bottom: 8px; }
    .hint { font-size: 14px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Login Successful</h1>
    <p>You have been authenticated with Timesheet CLI.</p>
    <p class="hint">You can close this window and return to the terminal.</p>
  </div>
</body>
</html>`;

/**
 * HTML page shown after failed authorization
 */
const ERROR_HTML = (error: string) => `<!DOCTYPE html>
<html>
<head>
  <title>Timesheet CLI - Login Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #ef4444; margin-bottom: 16px; }
    p { color: #666; margin-bottom: 8px; }
    .error { font-family: monospace; background: #fee2e2; padding: 8px; border-radius: 4px; }
    .hint { font-size: 14px; color: #999; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>✗ Login Failed</h1>
    <p>Authentication failed with the following error:</p>
    <p class="error">${error}</p>
    <p class="hint">Please close this window and try again.</p>
  </div>
</body>
</html>`;

/**
 * Find an available port for the callback server
 */
async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('Could not find available port')));
      }
    });
    server.on('error', reject);
  });
}

/**
 * Start a local HTTP server to receive the OAuth callback
 */
export async function startCallbackServer(
  expectedState: string
): Promise<{ port: number; waitForCallback: () => Promise<OAuthCallbackResult> }> {
  const port = await findAvailablePort();

  let resolveCallback: (result: OAuthCallbackResult) => void;
  let rejectCallback: (error: Error) => void;

  const callbackPromise = new Promise<OAuthCallbackResult>((resolve, reject) => {
    resolveCallback = resolve;
    rejectCallback = reject;
  });

  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const url = new URL(req.url, `http://localhost:${port}`);

    if (url.pathname !== CALLBACK_PATH) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      const message = errorDescription || error;
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML(message));
      closeServer();
      rejectCallback(
        new CLIError(`Authorization failed: ${message}`, ExitCode.AUTH_ERROR)
      );
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML('Missing authorization code'));
      closeServer();
      rejectCallback(
        new CLIError('Missing authorization code', ExitCode.AUTH_ERROR)
      );
      return;
    }

    if (state !== expectedState) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML('Invalid state parameter (possible CSRF attack)'));
      closeServer();
      rejectCallback(
        new CLIError(
          'Invalid state parameter (possible CSRF attack)',
          ExitCode.AUTH_ERROR
        )
      );
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(SUCCESS_HTML);
    closeServer();
    resolveCallback({ code, state });
  });

  const closeServer = () => {
    server.close();
  };

  // Set up timeout
  const timeout = setTimeout(() => {
    closeServer();
    rejectCallback(
      new CLIError(
        'Login timeout. Please try again.',
        ExitCode.AUTH_ERROR
      )
    );
  }, LOGIN_TIMEOUT);

  server.listen(port, '127.0.0.1');

  return {
    port,
    waitForCallback: async () => {
      try {
        const result = await callbackPromise;
        clearTimeout(timeout);
        return result;
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    },
  };
}

/**
 * Get the callback URL for a given port
 */
export function getCallbackUrl(port: number): string {
  return `http://localhost:${port}${CALLBACK_PATH}`;
}

import { randomBytes } from 'crypto';
import open from 'open';
import axios from 'axios';
import {
  OAuth21Auth,
  type PkceCodePair,
} from '@timesheet/sdk';
import { registerClient, getOAuthEndpoints } from './discovery.js';
import { startCallbackServer, getCallbackUrl } from './callback-server.js';
import {
  storeTokens,
  getTokens,
  clearTokens,
  isTokenExpired,
} from './session.js';
import {
  getOAuthClient,
  setOAuthClient,
} from '../config/index.js';
import type { OAuthTokens, OAuthClientCredentials } from '../types/index.js';
import { CLIError, ExitCode } from '../utils/index.js';

/**
 * Generate a random state parameter for CSRF protection
 */
function generateState(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Token response from OAuth server
 */
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

/**
 * Perform the complete OAuth 2.1 PKCE login flow
 */
export async function login(): Promise<void> {
  // Step 1: Discover OAuth endpoints
  const endpoints = await getOAuthEndpoints();

  // Step 2: Start callback server
  const state = generateState();
  const { port, waitForCallback } = await startCallbackServer(state);
  const redirectUri = getCallbackUrl(port);

  // Step 3: Get or register OAuth client using dynamic registration
  let client = getOAuthClient();
  if (!client) {
    client = await registerClient(redirectUri);
    setOAuthClient(client);
  }

  // Step 4: Generate PKCE parameters using SDK
  const pkce: PkceCodePair = OAuth21Auth.generatePkce();

  // Step 5: Build authorization URL using SDK with discovered endpoint
  const authUrl = OAuth21Auth.buildAuthorizationUrl({
    clientId: client.clientId,
    redirectUri,
    codeChallenge: pkce.codeChallenge,
    codeChallengeMethod: pkce.codeChallengeMethod,
    state,
    authorizationEndpoint: endpoints.authorizationEndpoint,
  });

  // Step 6: Open browser for user authentication
  await open(authUrl);

  // Step 7: Wait for callback with authorization code
  const { code } = await waitForCallback();

  // Step 8: Exchange code for tokens using SDK with discovered endpoint
  const tokens = await exchangeCodeForTokens(
    client,
    code,
    redirectUri,
    pkce.codeVerifier,
    endpoints.tokenEndpoint
  );

  // Step 9: Store tokens securely
  await storeTokens(tokens);
}

/**
 * Exchange authorization code for tokens using discovered token endpoint
 */
async function exchangeCodeForTokens(
  client: OAuthClientCredentials,
  code: string,
  redirectUri: string,
  codeVerifier: string,
  tokenEndpoint: string
): Promise<OAuthTokens> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: client.clientId,
    code_verifier: codeVerifier,
  });

  if (client.clientSecret) {
    params.append('client_secret', client.clientSecret);
  }

  try {
    const response = await axios.post<TokenResponse>(tokenEndpoint, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });

    const data = response.data;
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type || 'Bearer',
      expiresAt,
      scope: data.scope,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message;
      throw new CLIError(
        `Failed to exchange authorization code: ${message}`,
        ExitCode.AUTH_ERROR
      );
    }
    if (error instanceof Error) {
      throw new CLIError(
        `Failed to exchange authorization code: ${error.message}`,
        ExitCode.AUTH_ERROR
      );
    }
    throw error;
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(): Promise<OAuthTokens> {
  const tokens = await getTokens();
  if (!tokens?.refreshToken) {
    throw new CLIError(
      'No refresh token available. Please login again.',
      ExitCode.AUTH_ERROR
    );
  }

  const client = getOAuthClient();
  if (!client) {
    throw new CLIError(
      'No OAuth client configured. Please login again.',
      ExitCode.AUTH_ERROR
    );
  }

  const endpoints = await getOAuthEndpoints();

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: client.clientId,
  });

  if (client.clientSecret) {
    params.append('client_secret', client.clientSecret);
  }

  try {
    const response = await axios.post<TokenResponse>(
      endpoints.tokenEndpoint,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    const data = response.data;
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined;

    const newTokens: OAuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      tokenType: data.token_type || 'Bearer',
      expiresAt,
      scope: data.scope || tokens.scope,
    };

    // Update stored tokens
    await storeTokens(newTokens);

    return newTokens;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message;
      throw new CLIError(
        `Failed to refresh token: ${message}. Please login again.`,
        ExitCode.AUTH_ERROR
      );
    }
    throw error;
  }
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string> {
  const tokens = await getTokens();
  if (!tokens) {
    throw new CLIError(
      'Not authenticated. Please run "timesheet auth login".',
      ExitCode.AUTH_ERROR
    );
  }

  // Check if token needs refresh
  if (await isTokenExpired()) {
    if (tokens.refreshToken) {
      const newTokens = await refreshAccessToken();
      return newTokens.accessToken;
    }
    throw new CLIError(
      'Access token expired. Please login again.',
      ExitCode.AUTH_ERROR
    );
  }

  return tokens.accessToken;
}

/**
 * Logout - clear all stored credentials
 */
export async function logout(): Promise<void> {
  // Optionally revoke tokens on server
  const tokens = await getTokens();
  if (tokens?.accessToken) {
    try {
      const endpoints = await getOAuthEndpoints();
      if (endpoints.revocationEndpoint) {
        const client = getOAuthClient();
        if (client) {
          await axios.post(
            endpoints.revocationEndpoint,
            new URLSearchParams({
              token: tokens.accessToken,
              client_id: client.clientId,
            }),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: 5000,
            }
          );
        }
      }
    } catch {
      // Ignore revocation errors
    }
  }

  // Clear local tokens
  await clearTokens();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const tokens = await getTokens();
  return tokens !== null;
}

/**
 * Get current authentication status
 */
export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  method?: 'oauth' | 'apikey';
  expiresAt?: string;
  clientId?: string;
}> {
  const tokens = await getTokens();
  const client = getOAuthClient();

  if (tokens) {
    return {
      authenticated: true,
      method: 'oauth',
      expiresAt: tokens.expiresAt,
      clientId: client?.clientId,
    };
  }

  return { authenticated: false };
}

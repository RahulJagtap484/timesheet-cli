import keytar from 'keytar';
import type { OAuthTokens } from '../types';

const SERVICE_NAME = 'timesheet-cli';
const ACCESS_TOKEN_ACCOUNT = 'access_token';
const REFRESH_TOKEN_ACCOUNT = 'refresh_token';
const TOKEN_METADATA_ACCOUNT = 'token_metadata';

/**
 * Token metadata stored alongside tokens
 */
interface TokenMetadata {
  expiresAt?: string;
  tokenType: string;
  scope?: string;
}

/**
 * Store OAuth tokens securely in the system keychain
 */
export async function storeTokens(tokens: OAuthTokens): Promise<void> {
  const promises: Promise<void>[] = [];

  // Store access token
  promises.push(
    keytar.setPassword(SERVICE_NAME, ACCESS_TOKEN_ACCOUNT, tokens.accessToken)
  );

  // Store refresh token if available
  if (tokens.refreshToken) {
    promises.push(
      keytar.setPassword(
        SERVICE_NAME,
        REFRESH_TOKEN_ACCOUNT,
        tokens.refreshToken
      )
    );
  }

  // Store metadata
  const metadata: TokenMetadata = {
    expiresAt: tokens.expiresAt,
    tokenType: tokens.tokenType,
    scope: tokens.scope,
  };
  promises.push(
    keytar.setPassword(
      SERVICE_NAME,
      TOKEN_METADATA_ACCOUNT,
      JSON.stringify(metadata)
    )
  );

  await Promise.all(promises);
}

/**
 * Retrieve OAuth tokens from the system keychain
 */
export async function getTokens(): Promise<OAuthTokens | null> {
  const [accessToken, refreshToken, metadataJson] = await Promise.all([
    keytar.getPassword(SERVICE_NAME, ACCESS_TOKEN_ACCOUNT),
    keytar.getPassword(SERVICE_NAME, REFRESH_TOKEN_ACCOUNT),
    keytar.getPassword(SERVICE_NAME, TOKEN_METADATA_ACCOUNT),
  ]);

  if (!accessToken) {
    return null;
  }

  let metadata: TokenMetadata = {
    tokenType: 'Bearer',
  };

  if (metadataJson) {
    try {
      metadata = JSON.parse(metadataJson);
    } catch {
      // Ignore parse errors, use defaults
    }
  }

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
    expiresAt: metadata.expiresAt,
    tokenType: metadata.tokenType,
    scope: metadata.scope,
  };
}

/**
 * Clear all stored tokens
 */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    keytar.deletePassword(SERVICE_NAME, ACCESS_TOKEN_ACCOUNT),
    keytar.deletePassword(SERVICE_NAME, REFRESH_TOKEN_ACCOUNT),
    keytar.deletePassword(SERVICE_NAME, TOKEN_METADATA_ACCOUNT),
  ]);
}

/**
 * Check if tokens are stored
 */
export async function hasTokens(): Promise<boolean> {
  const accessToken = await keytar.getPassword(
    SERVICE_NAME,
    ACCESS_TOKEN_ACCOUNT
  );
  return accessToken !== null;
}

/**
 * Update just the access token (after refresh)
 */
export async function updateAccessToken(
  accessToken: string,
  expiresAt?: string
): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, ACCESS_TOKEN_ACCOUNT, accessToken);

  // Update metadata if expiry changed
  if (expiresAt) {
    const metadataJson = await keytar.getPassword(
      SERVICE_NAME,
      TOKEN_METADATA_ACCOUNT
    );
    let metadata: TokenMetadata = { tokenType: 'Bearer' };

    if (metadataJson) {
      try {
        metadata = JSON.parse(metadataJson);
      } catch {
        // Ignore
      }
    }

    metadata.expiresAt = expiresAt;
    await keytar.setPassword(
      SERVICE_NAME,
      TOKEN_METADATA_ACCOUNT,
      JSON.stringify(metadata)
    );
  }
}

/**
 * Check if access token is expired or about to expire
 */
export async function isTokenExpired(bufferMinutes = 5): Promise<boolean> {
  const metadataJson = await keytar.getPassword(
    SERVICE_NAME,
    TOKEN_METADATA_ACCOUNT
  );

  if (!metadataJson) {
    return true; // No metadata, assume expired
  }

  try {
    const metadata: TokenMetadata = JSON.parse(metadataJson);
    if (!metadata.expiresAt) {
      return false; // No expiry, assume valid
    }

    const expiresAt = new Date(metadata.expiresAt);
    const bufferMs = bufferMinutes * 60 * 1000;
    return new Date(Date.now() + bufferMs) >= expiresAt;
  } catch {
    return true; // Parse error, assume expired
  }
}

/**
 * Store API key (simpler alternative to OAuth)
 */
export async function storeApiKey(apiKey: string): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, 'api_key', apiKey);
}

/**
 * Get stored API key
 */
export async function getStoredApiKey(): Promise<string | null> {
  return keytar.getPassword(SERVICE_NAME, 'api_key');
}

/**
 * Clear stored API key
 */
export async function clearApiKey(): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, 'api_key');
}

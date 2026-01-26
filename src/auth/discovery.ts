import axios from 'axios';
import { hostname } from 'os';
import { getConfig } from '../config';
import type {
  OAuthServerMetadata,
  OAuthClientCredentials,
} from '../types';
import { CLIError, ExitCode } from '../utils';

const DISCOVERY_PATH = '/.well-known/oauth-authorization-server';

/**
 * Fetch OAuth server metadata from discovery endpoint
 */
export async function discoverOAuthServer(): Promise<OAuthServerMetadata> {
  const apiUrl = getConfig('apiUrl');
  const discoveryUrl = `${apiUrl}${DISCOVERY_PATH}`;

  try {
    const response = await axios.get<OAuthServerMetadata>(discoveryUrl, {
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        // Fallback to default endpoints if discovery is not available
        return getDefaultServerMetadata(apiUrl);
      }
      throw new CLIError(
        `Failed to discover OAuth server: ${error.message}`,
        ExitCode.NETWORK_ERROR
      );
    }
    throw error;
  }
}

/**
 * Get default OAuth server metadata when discovery is not available
 */
function getDefaultServerMetadata(apiUrl: string): OAuthServerMetadata {
  return {
    issuer: apiUrl,
    authorization_endpoint: `${apiUrl}/oauth2/auth`,
    token_endpoint: `${apiUrl}/oauth2/token`,
    registration_endpoint: `${apiUrl}/oauth2/register`,
    revocation_endpoint: `${apiUrl}/oauth2/revoke`,
    introspection_endpoint: `${apiUrl}/oauth2/introspect`,
    userinfo_endpoint: `${apiUrl}/oauth2/userinfo`,
    jwks_uri: `${apiUrl}/oauth2/jwks`,
    scopes_supported: ['openid', 'profile'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    code_challenge_methods_supported: ['S256'],
  };
}

/**
 * Dynamic Client Registration request body
 */
interface ClientRegistrationRequest {
  redirect_uris: string[];
  grant_types: string[];
  token_endpoint_auth_method: string;
  client_name: string;
  client_uri?: string;
  logo_uri?: string;
  contacts?: string[];
}

/**
 * Dynamic Client Registration response
 */
interface ClientRegistrationResponse {
  client_id: string;
  client_secret?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
  client_name?: string;
  redirect_uris?: string[];
  grant_types?: string[];
  token_endpoint_auth_method?: string;
}

/**
 * Register a new OAuth client dynamically (RFC 7591)
 */
export async function registerClient(
  redirectUri: string
): Promise<OAuthClientCredentials> {
  const metadata = await discoverOAuthServer();

  if (!metadata.registration_endpoint) {
    throw new CLIError(
      'OAuth server does not support dynamic client registration',
      ExitCode.AUTH_ERROR
    );
  }

  const clientName = `Timesheet CLI (${hostname()})`;

  const request: ClientRegistrationRequest = {
    redirect_uris: [redirectUri],
    grant_types: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_method: 'none', // Public client with PKCE
    client_name: clientName,
  };

  try {
    const response = await axios.post<ClientRegistrationResponse>(
      metadata.registration_endpoint,
      request,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    return {
      clientId: response.data.client_id,
      clientSecret: response.data.client_secret,
      registeredAt: new Date().toISOString(),
      clientName,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message;
      throw new CLIError(
        `Failed to register OAuth client: ${message}`,
        ExitCode.AUTH_ERROR
      );
    }
    throw error;
  }
}

/**
 * Get OAuth endpoints
 */
export async function getOAuthEndpoints(): Promise<{
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
}> {
  const metadata = await discoverOAuthServer();

  return {
    authorizationEndpoint: metadata.authorization_endpoint,
    tokenEndpoint: metadata.token_endpoint,
    revocationEndpoint: metadata.revocation_endpoint,
  };
}

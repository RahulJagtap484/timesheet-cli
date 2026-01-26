import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import type { CLIConfig, OAuthClientCredentials } from '../types/index.js';
import { defaultConfig, configSchema } from './schema.js';

// Configuration directory path
const CONFIG_DIR =
  process.env.TIMESHEET_CONFIG_DIR || join(homedir(), '.timesheet-cli');

/**
 * Main configuration store
 */
const configStore = new Conf<CLIConfig>({
  projectName: 'timesheet-cli',
  cwd: CONFIG_DIR,
  configName: 'config',
  defaults: defaultConfig,
  schema: configSchema as Record<keyof CLIConfig, Record<string, unknown>>,
});

/**
 * OAuth client credentials store
 */
const clientStore = new Conf<{ client?: OAuthClientCredentials }>({
  projectName: 'timesheet-cli',
  cwd: CONFIG_DIR,
  configName: 'client',
  defaults: {},
});

/**
 * Get the configuration directory path
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/**
 * Get a configuration value
 */
export function getConfig<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
  // Check environment variables first
  const envKey = `TIMESHEET_${key.toUpperCase()}`;
  const envValue = process.env[envKey];

  if (envValue !== undefined) {
    const schema = configSchema[key];
    if (schema.type === 'boolean') {
      return (envValue === 'true' || envValue === '1') as CLIConfig[K];
    }
    if (schema.type === 'number') {
      return parseInt(envValue, 10) as CLIConfig[K];
    }
    return envValue as CLIConfig[K];
  }

  return configStore.get(key);
}

/**
 * Set a configuration value
 */
export function setConfig<K extends keyof CLIConfig>(
  key: K,
  value: CLIConfig[K]
): void {
  configStore.set(key, value);
}

/**
 * Get all configuration values
 */
export function getAllConfig(): CLIConfig {
  const config = { ...configStore.store };

  // Apply environment overrides
  for (const key of Object.keys(defaultConfig) as (keyof CLIConfig)[]) {
    const envKey = `TIMESHEET_${key.toUpperCase()}`;
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      const schema = configSchema[key];
      if (schema.type === 'boolean') {
        (config as Record<string, unknown>)[key] =
          envValue === 'true' || envValue === '1';
      } else if (schema.type === 'number') {
        (config as Record<string, unknown>)[key] = parseInt(envValue, 10);
      } else {
        (config as Record<string, unknown>)[key] = envValue;
      }
    }
  }

  return config;
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  configStore.clear();
}

/**
 * Get OAuth client credentials
 */
export function getOAuthClient(): OAuthClientCredentials | undefined {
  return clientStore.get('client');
}

/**
 * Set OAuth client credentials
 */
export function setOAuthClient(client: OAuthClientCredentials): void {
  clientStore.set('client', client);
}

/**
 * Clear OAuth client credentials
 */
export function clearOAuthClient(): void {
  clientStore.delete('client');
}

/**
 * Get API key from environment or config
 */
export function getApiKey(): string | undefined {
  return process.env.TIMESHEET_API_KEY;
}

export { defaultConfig } from './schema.js';

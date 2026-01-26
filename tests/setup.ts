import { config } from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file for integration tests
config({ path: resolve(__dirname, '../.env') });

// Helper to check if we have a valid API key for integration tests
export function hasApiKey(): boolean {
  const apiKey = process.env.TIMESHEET_API_KEY;
  return !!apiKey && apiKey !== 'ts_your.apikey';
}

// Helper to skip integration tests when no API key is available
export function skipWithoutApiKey(): boolean {
  if (!hasApiKey()) {
    console.warn(
      'Skipping integration test: TIMESHEET_API_KEY not configured. ' +
        'Copy .env.example to .env and add your API key to run integration tests.'
    );
    return true;
  }
  return false;
}

// Get the test API key
export function getTestApiKey(): string {
  const apiKey = process.env.TIMESHEET_API_KEY;
  if (!apiKey || apiKey === 'ts_your.apikey') {
    throw new Error(
      'TIMESHEET_API_KEY not configured. Copy .env.example to .env and add your API key.'
    );
  }
  return apiKey;
}

// Get optional test project ID
export function getTestProjectId(): string | undefined {
  return process.env.TIMESHEET_TEST_PROJECT_ID;
}

// Get optional test team ID
export function getTestTeamId(): string | undefined {
  return process.env.TIMESHEET_TEST_TEAM_ID;
}

// Get API URL
export function getApiUrl(): string {
  return process.env.TIMESHEET_API_URL || 'https://api.timesheet.io';
}

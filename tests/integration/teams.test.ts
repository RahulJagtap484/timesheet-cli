import { describe, it, expect, beforeAll } from 'vitest';
import { TimesheetClient } from '@timesheet/sdk';
import { getTestApiKey, hasApiKey, getApiUrl, getTestTeamId } from '../setup.js';

describe('Teams API Integration', () => {
  let client: TimesheetClient;

  beforeAll(() => {
    if (!hasApiKey()) {
      return;
    }
    client = new TimesheetClient({
      apiKey: getTestApiKey(),
      baseUrl: getApiUrl(),
    });
  });

  it.skipIf(!hasApiKey())('should list teams', async () => {
    const response = await client.teams.list();

    expect(response).toBeDefined();
    expect(response.items).toBeDefined();
    expect(Array.isArray(response.items)).toBe(true);

    // Each team should have required fields
    for (const team of response.items) {
      expect(team.id).toBeDefined();
      expect(typeof team.id).toBe('string');
      expect(team.name).toBeDefined();
      expect(typeof team.name).toBe('string');
    }
  });

  it.skipIf(!hasApiKey())('should get a specific team', async () => {
    // Use test team ID from env or find one
    let teamId = getTestTeamId();

    if (!teamId) {
      const listResponse = await client.teams.list();
      if (listResponse.items.length === 0) {
        console.warn('No teams available to test get by ID');
        return;
      }
      teamId = listResponse.items[0].id;
    }

    const team = await client.teams.get(teamId);

    expect(team).toBeDefined();
    expect(team.id).toBe(teamId);
    expect(team.name).toBeDefined();
  });
});

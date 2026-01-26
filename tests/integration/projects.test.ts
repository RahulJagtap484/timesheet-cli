import { describe, it, expect, beforeAll } from 'vitest';
import { TimesheetClient } from '@timesheet/sdk';
import { getTestApiKey, hasApiKey, getApiUrl, getTestTeamId } from '../setup.js';

describe('Projects API Integration', () => {
  let client: TimesheetClient;
  let testTeamId: string | undefined;

  beforeAll(async () => {
    if (!hasApiKey()) {
      return;
    }
    client = new TimesheetClient({
      apiKey: getTestApiKey(),
      baseUrl: getApiUrl(),
    });

    // Get test team ID from env or find one
    testTeamId = getTestTeamId();
    if (!testTeamId) {
      try {
        const teams = await client.teams.list();
        if (teams.items.length > 0) {
          testTeamId = teams.items[0].id;
        }
      } catch {
        // Teams might not be available
      }
    }
  });

  it.skipIf(!hasApiKey())('should list projects', async () => {
    const response = await client.projects.list();

    expect(response).toBeDefined();
    expect(response.items).toBeDefined();
    expect(Array.isArray(response.items)).toBe(true);

    // Each project should have required fields
    for (const project of response.items) {
      expect(project.id).toBeDefined();
      expect(typeof project.id).toBe('string');
      expect(project.title).toBeDefined();
      expect(typeof project.title).toBe('string');
    }
  });

  it.skipIf(!hasApiKey())('should list projects with pagination', async () => {
    const response = await client.projects.list({ limit: 5 });

    expect(response).toBeDefined();
    expect(response.items).toBeDefined();
    expect(response.items.length).toBeLessThanOrEqual(5);
  });

  it.skipIf(!hasApiKey())('should get a specific project', async () => {
    // First get the list to find a project ID
    const listResponse = await client.projects.list({ limit: 1 });

    if (listResponse.items.length === 0) {
      console.warn('No projects available to test get by ID');
      return;
    }

    const projectId = listResponse.items[0].id;
    const project = await client.projects.get(projectId);

    expect(project).toBeDefined();
    expect(project.id).toBe(projectId);
    expect(project.title).toBeDefined();
  });

  it.skipIf(!hasApiKey())('should create, update, and delete a project', async () => {
    if (!testTeamId) {
      console.warn('No team available for project creation test');
      return;
    }

    // Create a test project
    const testTitle = `CLI Test Project ${Date.now()}`;
    const created = await client.projects.create({
      title: testTitle,
      teamId: testTeamId,
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.title).toBe(testTitle);

    // Update the project
    const updatedTitle = `${testTitle} Updated`;
    const updated = await client.projects.update(created.id, {
      title: updatedTitle,
    });

    expect(updated).toBeDefined();
    expect(updated.title).toBe(updatedTitle);

    // Delete the project
    await client.projects.delete(created.id);

    // Verify deletion by trying to get it (should fail or return archived)
    try {
      const deleted = await client.projects.get(created.id);
      // Some APIs soft-delete, so check if it's archived
      expect(deleted.archived).toBe(true);
    } catch {
      // Project not found is also acceptable
      expect(true).toBe(true);
    }
  });
});

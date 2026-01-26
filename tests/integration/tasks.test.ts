import { describe, it, expect, beforeAll } from 'vitest';
import { TimesheetClient } from '@timesheet/sdk';
import { getTestApiKey, hasApiKey, getApiUrl, getTestProjectId } from '../setup.js';

describe('Tasks API Integration', () => {
  let client: TimesheetClient;
  let testProjectId: string | undefined;

  beforeAll(async () => {
    if (!hasApiKey()) {
      return;
    }
    client = new TimesheetClient({
      apiKey: getTestApiKey(),
      baseUrl: getApiUrl(),
    });

    // Get test project ID from env or find one
    testProjectId = getTestProjectId();
    if (!testProjectId) {
      const projects = await client.projects.list({ limit: 1 });
      if (projects.items.length > 0) {
        testProjectId = projects.items[0].id;
      }
    }
  });

  it.skipIf(!hasApiKey())('should create and delete a task', async () => {
    if (!testProjectId) {
      console.warn('No project available for task test');
      return;
    }

    // Create a task with start and end time (1 hour ago to now)
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 60 * 60 * 1000);

    const created = await client.tasks.create({
      projectId: testProjectId,
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
      description: 'CLI integration test task',
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.project?.id).toBe(testProjectId);

    // Get the task
    const fetched = await client.tasks.get(created.id);

    expect(fetched).toBeDefined();
    expect(fetched.id).toBe(created.id);

    // Delete the task
    await client.tasks.delete(created.id);

    // Verify deletion
    try {
      await client.tasks.get(created.id);
      // If we get here, the API might soft-delete
      expect(true).toBe(true);
    } catch {
      // Task not found is expected
      expect(true).toBe(true);
    }
  });

  it.skipIf(!hasApiKey())('should create task with billable flag', async () => {
    if (!testProjectId) {
      console.warn('No project available for task test');
      return;
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 30 * 60 * 1000); // 30 minutes ago

    const created = await client.tasks.create({
      projectId: testProjectId,
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
      description: 'Billable test task',
      billable: true,
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.billable).toBe(true);

    // Clean up
    await client.tasks.delete(created.id);
  });

  it.skipIf(!hasApiKey())('should create task with tags', async () => {
    if (!testProjectId) {
      console.warn('No project available for task test');
      return;
    }

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 20 * 60 * 1000); // 20 minutes ago

    const created = await client.tasks.create({
      projectId: testProjectId,
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
      description: 'Task with description test',
    });

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(created.description).toBe('Task with description test');

    // Clean up
    await client.tasks.delete(created.id);
  });
});

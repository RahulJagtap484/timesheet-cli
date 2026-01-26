import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { TimesheetClient } from '@timesheet/sdk';
import { getTestApiKey, hasApiKey, getApiUrl, getTestProjectId } from '../setup.js';

describe('Timer API Integration', () => {
  let client: TimesheetClient;
  let testProjectId: string | undefined;

  // Helper to safely stop timer
  async function ensureTimerStopped() {
    try {
      const status = await client.timer.get();
      if (status.status !== 'stopped') {
        await client.timer.stop();
      }
    } catch {
      // Ignore errors - timer might already be stopped
    }
  }

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

    // Ensure timer is stopped before tests
    await ensureTimerStopped();
  });

  afterEach(async () => {
    if (!hasApiKey() || !client) {
      return;
    }
    // Clean up: ensure timer is stopped after each test
    await ensureTimerStopped();
  });

  it.skipIf(!hasApiKey())('should get timer status', async () => {
    const timer = await client.timer.get();

    expect(timer).toBeDefined();
    expect(timer.status).toBeDefined();
    expect(['running', 'paused', 'stopped']).toContain(timer.status);
  });

  it.skipIf(!hasApiKey())('should start and stop timer', async () => {
    if (!testProjectId) {
      console.warn('No project available for timer test');
      return;
    }

    // Start the timer
    const started = await client.timer.start({ projectId: testProjectId });

    expect(started).toBeDefined();
    expect(started.status).toBe('running');

    // Verify status after starting
    const runningStatus = await client.timer.get();
    expect(runningStatus.status).toBe('running');
    expect(runningStatus.task).toBeDefined();

    // Stop the timer
    const stopped = await client.timer.stop();

    expect(stopped).toBeDefined();
    expect(stopped.status).toBe('stopped');

    // Verify it's stopped
    const stoppedStatus = await client.timer.get();
    expect(stoppedStatus.status).toBe('stopped');
  });

  it.skipIf(!hasApiKey())('should pause and resume timer', async () => {
    if (!testProjectId) {
      console.warn('No project available for timer test');
      return;
    }

    // Start the timer
    await client.timer.start({ projectId: testProjectId });

    // Pause the timer
    const paused = await client.timer.pause();

    expect(paused).toBeDefined();
    expect(paused.status).toBe('paused');

    // Resume the timer
    const resumed = await client.timer.resume();

    expect(resumed).toBeDefined();
    expect(resumed.status).toBe('running');
  });

  it.skipIf(!hasApiKey())('should update timer description', async () => {
    if (!testProjectId) {
      console.warn('No project available for timer test');
      return;
    }

    // Start the timer
    await client.timer.start({ projectId: testProjectId });

    // Verify timer is running before update
    const status = await client.timer.get();
    expect(status.status).toBe('running');

    // Update the timer with description
    const testDescription = `Test description ${Date.now()}`;
    const updated = await client.timer.update({
      description: testDescription,
    });

    expect(updated).toBeDefined();
    expect(updated.task?.description).toBe(testDescription);
  });
});

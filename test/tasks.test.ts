import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

describe('tasks API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  const createTask = (payload: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/api/tasks', payload });

  it('creates a task with sensible defaults', async () => {
    const response = await createTask({ title: '  Write README  ' });

    expect(response.statusCode).toBe(201);
    const task = response.json();
    expect(task).toMatchObject({ title: 'Write README', status: 'todo', priority: 'medium', completedAt: null });
    expect(response.headers.location).toBe(`/api/tasks/${task.id}`);
  });

  it('rejects invalid input with field-level details', async () => {
    const response = await createTask({ title: '', priority: 'urgent' });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.details.map((detail: { path: string }) => detail.path)).toEqual(
      expect.arrayContaining(['title', 'priority']),
    );
  });

  it('rejects an empty update', async () => {
    const { id } = (await createTask({ title: 'Plan sprint' })).json();

    const response = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, payload: {} });

    expect(response.statusCode).toBe(400);
  });

  it('returns 404 for an unknown task', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/tasks/2b1f8f0e-4c1a-4f7e-9d55-3f2b8c6a9e10' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('NOT_FOUND');
  });

  it('filters and paginates the task list', async () => {
    for (const priority of ['high', 'low', 'high', 'high']) {
      await createTask({ title: `${priority} priority task`, priority });
    }

    const response = await app.inject({ method: 'GET', url: '/api/tasks?priority=high&limit=2&offset=1' });

    const page = response.json();
    expect(page).toMatchObject({ total: 3, limit: 2, offset: 1 });
    expect(page.items).toHaveLength(2);
    expect(page.items.every((task: { priority: string }) => task.priority === 'high')).toBe(true);
  });

  it('records completion and locks completed tasks until they are reopened', async () => {
    const { id } = (await createTask({ title: 'Ship v1' })).json();

    const done = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, payload: { status: 'done' } });
    expect(done.json().completedAt).toEqual(expect.any(String));

    const edit = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, payload: { title: 'Ship v2' } });
    expect(edit.statusCode).toBe(409);

    const reopened = await app.inject({ method: 'PATCH', url: `/api/tasks/${id}`, payload: { status: 'in_progress' } });
    expect(reopened.json()).toMatchObject({ status: 'in_progress', completedAt: null });
  });

  it('deletes a task', async () => {
    const { id } = (await createTask({ title: 'Temporary' })).json();

    expect((await app.inject({ method: 'DELETE', url: `/api/tasks/${id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: 'GET', url: `/api/tasks/${id}` })).statusCode).toBe(404);
  });
});

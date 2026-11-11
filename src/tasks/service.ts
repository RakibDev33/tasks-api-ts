import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '../errors.js';
import type { Page, TaskRepository } from './repository.js';
import type { CreateTaskInput, ListTasksQuery, Task, UpdateTaskInput } from './schemas.js';

export type Clock = () => Date;

/** Business rules for tasks. Transport-agnostic: no HTTP concepts leak in here. */
export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly clock: Clock = () => new Date(),
  ) {}

  async create(input: CreateTaskInput): Promise<Task> {
    const now = this.clock().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: input.title,
      description: input.description ?? null,
      status: 'todo',
      priority: input.priority,
      dueDate: input.dueDate ?? null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    await this.repository.insert(task);
    return task;
  }

  async get(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) throw new NotFoundError('Task', id);
    return task;
  }

  list(query: ListTasksQuery): Promise<Page<Task>> {
    return this.repository.list(query);
  }

  async update(id: string, changes: UpdateTaskInput): Promise<Task> {
    const task = await this.get(id);

    const reopening = changes.status !== undefined && changes.status !== 'done';
    if (task.status === 'done' && !reopening) {
      throw new ConflictError('Completed tasks are read-only; reopen the task before editing it');
    }

    const now = this.clock().toISOString();
    const updated: Task = { ...task, ...changes, updatedAt: now };
    if (changes.status && changes.status !== task.status) {
      updated.completedAt = changes.status === 'done' ? now : null;
    }

    await this.repository.update(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new NotFoundError('Task', id);
  }
}

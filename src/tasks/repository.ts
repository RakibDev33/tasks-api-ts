import type { Task, TaskPriority, TaskStatus } from './schemas.js';

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  limit: number;
  offset: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Persistence port. The service depends on this interface, never on a concrete store. */
export interface TaskRepository {
  insert(task: Task): Promise<void>;
  findById(id: string): Promise<Task | undefined>;
  list(filter: TaskFilter): Promise<Page<Task>>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<boolean>;
}

/**
 * In-memory adapter used for local development and tests.
 * Records are cloned on the way in and out so callers can never mutate stored state.
 */
export class InMemoryTaskRepository implements TaskRepository {
  private readonly tasks = new Map<string, Task>();

  async insert(task: Task): Promise<void> {
    this.tasks.set(task.id, structuredClone(task));
  }

  async findById(id: string): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    return task ? structuredClone(task) : undefined;
  }

  async list({ status, priority, limit, offset }: TaskFilter): Promise<Page<Task>> {
    const matches = [...this.tasks.values()]
      .filter((task) => !status || task.status === status)
      .filter((task) => !priority || task.priority === priority)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    return {
      items: matches.slice(offset, offset + limit).map((task) => structuredClone(task)),
      total: matches.length,
      limit,
      offset,
    };
  }

  async update(task: Task): Promise<void> {
    this.tasks.set(task.id, structuredClone(task));
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

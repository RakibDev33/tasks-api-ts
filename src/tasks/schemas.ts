import { z } from 'zod';

export const TaskStatus = z.enum(['todo', 'in_progress', 'done']);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const TaskPriority = z.enum(['low', 'medium', 'high']);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const CreateTaskInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: TaskPriority.default('medium'),
  dueDate: z.iso.date().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskInput>;

export const UpdateTaskInput = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).nullable(),
    priority: TaskPriority,
    status: TaskStatus,
    dueDate: z.iso.date().nullable(),
  })
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, { error: 'At least one field must be provided' });
export type UpdateTaskInput = z.infer<typeof UpdateTaskInput>;

export const ListTasksQuery = z.object({
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListTasksQuery = z.infer<typeof ListTasksQuery>;

export const TaskIdParams = z.object({ id: z.uuid() });

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

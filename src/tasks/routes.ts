import type { FastifyPluginAsync } from 'fastify';
import { CreateTaskInput, ListTasksQuery, TaskIdParams, UpdateTaskInput } from './schemas.js';
import type { TaskService } from './service.js';

export interface TaskRoutesOptions {
  service: TaskService;
}

/** HTTP adapter: parses input with Zod, delegates to the service, shapes the response. */
export const taskRoutes: FastifyPluginAsync<TaskRoutesOptions> = async (app, { service }) => {
  app.get('/', async (request) => service.list(ListTasksQuery.parse(request.query)));

  app.get('/:id', async (request) => {
    const { id } = TaskIdParams.parse(request.params);
    return service.get(id);
  });

  app.post('/', async (request, reply) => {
    const task = await service.create(CreateTaskInput.parse(request.body));
    return reply
      .status(201)
      .header('location', `${request.url.replace(/\/$/, '')}/${task.id}`)
      .send(task);
  });

  app.patch('/:id', async (request) => {
    const { id } = TaskIdParams.parse(request.params);
    return service.update(id, UpdateTaskInput.parse(request.body));
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = TaskIdParams.parse(request.params);
    await service.delete(id);
    return reply.status(204).send();
  });
};

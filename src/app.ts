import Fastify, { type FastifyServerOptions } from 'fastify';
import { errorHandler } from './errors.js';
import { InMemoryTaskRepository, type TaskRepository } from './tasks/repository.js';
import { taskRoutes } from './tasks/routes.js';
import { TaskService } from './tasks/service.js';

export interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  repository?: TaskRepository;
}

/** Composition root: wires dependencies together. Tests call this directly. */
export function buildApp({ logger = false, repository = new InMemoryTaskRepository() }: AppOptions = {}) {
  const app = Fastify({ logger });
  const service = new TaskService(repository);

  app.setErrorHandler(errorHandler);
  app.get('/health', async () => ({ status: 'ok' }));
  app.register(taskRoutes, { prefix: '/api/tasks', service });

  return app;
}

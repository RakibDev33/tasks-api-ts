# tasks-api-ts

![CI](https://github.com/RakibDev33/tasks-api-ts/actions/workflows/ci.yml/badge.svg)

A task management REST API built with **Fastify 5**, **TypeScript** and **Zod**. The project is small on purpose, but it follows the structure of a production service: a thin HTTP layer, transport-agnostic business rules, and persistence behind an interface.

## Features

- CRUD endpoints for tasks with filtering (`status`, `priority`) and offset pagination
- Request validation with Zod, returning field-level error details
- Consistent JSON error contract (`400`, `404`, `409`, `500`) from one error handler
- Business rule example: completed tasks are read-only until they are reopened, and `completedAt` is tracked automatically
- Structured logging (pino), graceful shutdown on `SIGINT`/`SIGTERM`, `/health` endpoint
- Integration tests with Vitest using Fastify's in-process `inject()` (no network, fast)
- Multi-stage Docker image running as a non-root user

## Architecture

```
src/
├── app.ts               # Composition root: wires repository -> service -> routes
├── server.ts            # Process entry point (config, listen, graceful shutdown)
├── errors.ts            # Domain errors + central HTTP error mapping
└── tasks/
    ├── schemas.ts       # Zod schemas and inferred types (single source of truth)
    ├── routes.ts        # HTTP adapter: parse input, call service, shape response
    ├── service.ts       # Business rules, no HTTP knowledge
    └── repository.ts    # Persistence port + in-memory adapter
```

The service only depends on the `TaskRepository` interface, so replacing the in-memory adapter with PostgreSQL (or anything else) does not touch the business rules or the routes. `buildApp()` accepts a repository, which keeps tests isolated and fast.

## API

| Method | Path             | Description                                   |
| ------ | ---------------- | --------------------------------------------- |
| GET    | `/health`        | Liveness check                                |
| GET    | `/api/tasks`     | List tasks (`status`, `priority`, `limit`, `offset`) |
| GET    | `/api/tasks/:id` | Get a task                                    |
| POST   | `/api/tasks`     | Create a task                                 |
| PATCH  | `/api/tasks/:id` | Partially update a task                       |
| DELETE | `/api/tasks/:id` | Delete a task                                 |

Example:

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H 'content-type: application/json' \
  -d '{"title": "Write release notes", "priority": "high", "dueDate": "2026-12-01"}'
```

Validation error response:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [{ "path": "title", "message": "Too small: expected string to have >=1 characters" }]
}
```

## Getting started

Requires Node.js 22+.

```bash
npm install
npm run dev        # start with hot reload on http://localhost:3000
npm test           # run the test suite
npm run build      # compile to dist/
```

Environment variables: `PORT` (default `3000`), `HOST` (default `0.0.0.0`), `LOG_LEVEL` (default `info`).

### Docker

```bash
docker build -t tasks-api-ts .
docker run -p 3000:3000 tasks-api-ts
```

## License

MIT

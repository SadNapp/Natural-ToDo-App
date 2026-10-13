# Backend

The backend is an ASP.NET Core 10 Web API for task management and the finance notebook. The project file is `Backend.csproj`; the solution is `../Backend.sln`.

## Responsibilities

- Expose task and finance HTTP APIs.
- Persist tasks and finance data in PostgreSQL through Entity Framework Core and Npgsql.
- Use JSON file storage as a fallback for task operations while PostgreSQL is unavailable.
- Initialize the development database schema and seed default finance categories at startup.
- Write structured logs to the console and rolling files.

## Project structure

- `Application/` — task services, fallback selection, and synchronization.
- `Contracts/` — service interfaces and HTTP write models.
- `Controllers/` — API controllers.
- `Domain/` — entities and enums.
- `Infrastructure/` — EF Core context, entity configuration, finance SQL schema, and fallback data.
- `Properties/launchSettings.json` — local HTTP and HTTPS profiles.

## Requirements and configuration

- .NET SDK 10.
- PostgreSQL 15 or compatible PostgreSQL server.
- Set `ConnectionStrings__DefaultConnection` to a valid PostgreSQL connection string. The container uses the `db` service hostname; local development commonly uses `localhost`.
- `Cors:AllowedOrigins` can be configured as an array in application configuration. The default list includes the local Vite origins.

Do not commit database passwords or production credentials. The checked-in `appsettings.json` connection string is a local placeholder.

## Run locally

From the repository root:

```bash
dotnet run --project backend/Backend.csproj
```

Or from this directory:

```bash
dotnet run --project Backend.csproj
```

The HTTP profile listens on `http://localhost:5186`. In Development, Swagger UI is served from `/swagger`; `/health` returns a basic process health response.

## API routes

### Tasks: `/api/todo`

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/todo` | List active tasks |
| `POST` | `/api/todo` | Create a task |
| `PUT` | `/api/todo/{id}` | Update a task |
| `DELETE` | `/api/todo/{id}` | Move a task to the archive |
| `GET` | `/api/todo/deleted` | List archived tasks |
| `PUT` | `/api/todo/{id}/restore` | Restore an archived task |
| `DELETE` | `/api/todo/{id}/hard` | Permanently delete a task |

The task service sets the `X-Fallback-Mode: true` response header when it serves a request from JSON file storage.

### Finance: `/api/finance`

The finance controller returns JSON fields in camel case. Its route groups are:

- `GET /api/finance/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET`, `PUT /api/finance/categories`
- `GET`, `POST /api/finance/operations`; `GET`, `PUT`, `DELETE /api/finance/operations/{id}`; `PUT /api/finance/operations/{id}/restore`; `DELETE /api/finance/operations/{id}/hard`
- `GET /api/finance/budgets`; `GET /api/finance/budgets?month=YYYY-MM`; `PUT /api/finance/budgets/{month}`; `GET /api/finance/budgets/templates`
- `GET`, `POST /api/finance/goals`; `GET`, `PUT`, `DELETE /api/finance/goals/{id}`
- `GET`, `POST /api/finance/goal-contributions`; `GET /api/finance/goals/{goalId}/contributions`; `POST /api/finance/goals/{goalId}/contributions`; `DELETE /api/finance/goals/{goalId}/contributions/{id}`

Use the Development Swagger document at `/swagger` as the exact request/response reference.

## Persistence behavior

At startup, the API waits briefly for PostgreSQL. If it is available, the app calls `EnsureCreated`, checks the finance table schema in the bundled `Infrastructure/finance-schema.sql`, and seeds default categories. If PostgreSQL is unavailable, the API starts with a JSON fallback for task endpoints. Finance endpoints use EF Core directly and need PostgreSQL.

The task fallback file is `FallbackStorage/Saves/todos.json` under the application base directory. Docker Compose mounts a named volume at that path. When PostgreSQL returns, the fallback service synchronizes its task records to the database.

Schema setup is currently an initialization path rather than a migration workflow. For production schema changes, introduce and apply versioned EF Core migrations before relying on application startup to update deployed data.

## Build

From the repository root:

```bash
dotnet restore Backend.sln
dotnet build Backend.sln --configuration Release
```

## Docker image

The backend Dockerfile is `Dockerfile`. Compose builds it from the repository root so that it can copy `backend/Backend.csproj` and the bundled SQL file. The image listens on port `8080`; Compose publishes it on host port `5186`.

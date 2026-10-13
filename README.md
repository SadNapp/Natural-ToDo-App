# Natural ToDo

Natural ToDo is a full-stack personal organizer with task management and a finance notebook. It combines a React interface, an ASP.NET Core API, and PostgreSQL, and can also run locally with Docker Compose.

## Features

- Create, update, complete, archive, restore, and permanently delete tasks.
- Track income and expenses, organize categories, plan monthly budgets, and manage savings goals and contributions.
- Use browser local storage for finance data in mock mode, or the Finance API in API mode.
- Keep task data available through the API's JSON file fallback when PostgreSQL is unavailable.
- Browse a responsive dark forest themed interface.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 19, Vite, JavaScript |
| Backend | ASP.NET Core 10, Entity Framework Core, Npgsql |
| Database | PostgreSQL 15 |
| Delivery | Docker Compose, Nginx, GitHub Actions |

## Repository layout

```text
backend/     ASP.NET Core API and persistence
frontend/    React application
Backend.sln  .NET solution
compose.yaml Local full-stack environment
```

Each application layer has its own technical guide: [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## Run with Docker Compose

Requirements: Docker Desktop or Docker Engine with the Compose plugin.

```bash
docker compose up --build
```

Open the frontend at <http://localhost:5173>. The API is at <http://localhost:5186>; the task endpoint is `/api/todo`, and the finance endpoints are under `/api/finance`. Swagger UI is available in development mode at `/swagger`.

To stop the services, run `docker compose down`. PostgreSQL and fallback data use named volumes and remain after stopping. To also remove the database volume and its data, run `docker compose down -v`.

Compose reads optional overrides from a root `.env` file. Start from `.env.example` and set matching database variables together: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_CONNECTION_STRING`. The default credentials are for local development only.

## Run services locally

Start PostgreSQL separately, then set `ConnectionStrings__DefaultConnection` for the backend. From the repository root:

```bash
dotnet run --project backend/Backend.csproj
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

The backend HTTP profile uses `http://localhost:5186`; the Vite server uses `http://localhost:5173`.

## Development checks

```bash
dotnet build Backend.sln --configuration Release
cd frontend
npm ci
npm run lint
npm run build
```

## Data and deployment notes

- Tasks use the PostgreSQL-backed API when the database is reachable; the API switches task reads and writes to its JSON fallback otherwise. Finance endpoints require PostgreSQL and do not currently have a file fallback.
- Finance API mode is enabled by Docker Compose. Frontend mock mode stores finance data in the current browser's `localStorage` and is intended for local use.
- The application does not currently include user authentication or per-user data isolation. Do not expose it publicly with real personal or financial data without adding those controls and HTTPS.
- Database schema creation currently runs at application startup using EF Core `EnsureCreated` and the bundled `backend/Infrastructure/finance-schema.sql`. This is suitable for development; use versioned EF migrations for production schema evolution.

## License

See [LICENSE](LICENSE).

# Backend

ASP.NET Core API for tasks and the Finance notebook. The frontend is a separate Vite application in `../frontend`.

## Structure

- `Application/` — todo services and JSON fallback storage.
- `Contracts/` — request/response contracts and service interfaces.
- `Controllers/` — HTTP endpoints (`/api/todo`, `/api/finance`).
- `Domain/` — entities and enums.
- `Infrastructure/` — EF Core context/configuration, migrations, SQL bootstrap schema, fallback data.

## Run

From the repository root:

```sh
docker compose up --build
```

The frontend is available at `http://localhost:5173`; the API listens on `http://localhost:5186`.

For local development:

```sh
dotnet run --project backend/Backend.csproj
```

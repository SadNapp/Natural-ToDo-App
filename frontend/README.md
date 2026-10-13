# Frontend

The frontend is a React 19 single-page application built with Vite. It provides task management and a personal finance notebook with a responsive dark forest visual theme.

## Requirements

- Node.js 20 or later.
- npm (the project is locked with `package-lock.json`).
- The backend API for task synchronization. Finance features can run against browser mock storage or the Finance API.

## Install and run

From this directory:

```bash
npm ci
npm run dev
```

Vite serves the app at <http://localhost:5173>. The development server can be configured through `vite.config.js`.

## Configuration

Create `.env.local` in this directory to override frontend settings:

```env
VITE_API_URL=http://localhost:5186/api/todo
VITE_FINANCE_DATA_MODE=mock
VITE_FINANCE_API_URL=http://localhost:5186/api/finance
```

`VITE_API_URL` is the Todo API base URL. `VITE_FINANCE_DATA_MODE` accepts `mock` or `api`; mock is the default. In mock mode, finance data is saved to `localStorage` in the current browser. `VITE_FINANCE_API_URL` is used only in API mode.

Vite embeds `VITE_*` values into the browser bundle. Never put credentials, secrets, or private keys in these variables.

## Data services

- `src/services/api.js` — task API adapter with browser-local fallback and API fallback status handling.
- `src/services/financeService.js` — finance API adapter and browser `localStorage` mock implementation.
- `src/utils/finance.js` — finance date and amount helpers.

Task records are sent to `/api/todo`. Finance API mode uses `/api/finance` resource routes. Finance API failures are surfaced to the UI; finance mock data is local to one browser and is not synchronized to the backend.

## Source layout

- `src/TodoApp.jsx` — application state, navigation, and top-level view composition.
- `src/components/finance/` — overview, operations, budgets, goals, notes, and archive views.
- `src/components/` — shared interface components.
- `src/styles/` — application and component styles.
- `public/` and `Assets/` — static application assets.

## Build and lint

```bash
npm run lint
npm run build
npm run preview
```

`npm run preview` serves the production bundle generated in `dist/`.

## Docker

The multi-stage `Dockerfile` installs dependencies, builds the static assets, and serves them through Nginx. Compose builds it with `VITE_API_URL`, `VITE_FINANCE_DATA_MODE`, and `VITE_FINANCE_API_URL` build arguments. The API URL must be reachable from the user's browser; the Compose defaults use `localhost:5186` for local use.

The Nginx configuration supports SPA route fallback. It does not proxy API requests; the browser calls the configured API origin directly.

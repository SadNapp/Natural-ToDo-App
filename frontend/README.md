# Finance TodoList frontend

React + Vite frontend for a personal finance notebook, budget planner, savings goals, ordinary notes and tasks. It preserves the dark forest glass style and includes local mock storage for financial features. The nature fact card remains part of the interface.

## Run

```bash
npm install
npm run dev
npm run build
```

Financial data uses the local mock service by default. To opt into a future Finance API, create `.env.local`:

```env
VITE_FINANCE_DATA_MODE=api
VITE_FINANCE_API_URL=https://localhost:7080/api/finance
```

See [READMEFrontend.md](READMEFrontend.md) for the data model, calculation rules, and proposed API contract. The Finance API described there is not implemented by this frontend change.

Existing notes and tasks keep using the Todo API adapter. Its base address can be set with `VITE_API_URL` (defaults to `http://localhost:5186/api/todo`).

## Source layout

- `src/TodoApp.jsx` composes the application and navigation.
- `src/components/finance/` contains section-specific views.
- `src/services/financeService.js` selects local mock storage or the future API adapter.
- `src/services/api.js` retains the existing Todo API/offline adapter.
- `src/styles/` contains the forest-glass visual system and responsive layouts.

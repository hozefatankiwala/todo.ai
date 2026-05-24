# simple-todo

A mobile-first PWA for capturing tasks by voice with push reminders.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend:** FastAPI + SQLAlchemy (async) + SQLite + APScheduler

## Development

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && uv run uvicorn app.main:app --reload
```

## Env setup

Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in values.

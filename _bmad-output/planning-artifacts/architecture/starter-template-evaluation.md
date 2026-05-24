# Starter Template Evaluation

## Primary Technology Domain

Full-stack web (mobile-first PWA), monorepo layout.
Frontend and backend are separate sub-projects within one repository.

## Evaluated Options

| Option | Verdict |
|---|---|
| Next.js full-stack | Rejected — adds SSR complexity for a single-user SPA; UX spec already committed to Vite |
| Vite + React + separate FastAPI | **Selected** — matches UX spec commitments, PWA-friendly, cleanly separates concerns |
| Node.js backend (Express/Fastify) | Rejected — Python selected as deliberate learning investment for future projects |

## Selected Starter: Vite + React-TS + shadcn/ui v4 (frontend) · FastAPI + uv (backend)

**Rationale:**
- UX specification explicitly committed to Tailwind CSS + shadcn/ui + React — no re-evaluation needed
- Vite 6 is the natural pairing (fast dev server, `vite-plugin-pwa` for service worker/manifest)
- Tailwind v4 (CSS-first, no `tailwind.config.js`) is current and shadcn/ui v4 is fully compatible
- FastAPI + Python chosen as a deliberate learning investment for future projects; APScheduler is Python-native and fits the single-user scale
- `uv` is the 2026 standard Python package manager (replaces pip/poetry for new projects)

## Initialization Sequence

```bash
# 1. Monorepo root
mkdir simple-todo && cd simple-todo && git init

# 2. Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
npm install tailwindcss @tailwindcss/vite        # Tailwind v4
npx shadcn@latest init                            # shadcn/ui v4 (interactive — picks up Tailwind v4)
npm install vite-plugin-pwa -D                    # PWA: service worker + web app manifest
cd ..

# 3. Backend
uv init backend --app
cd backend
uv add "fastapi[all]" "uvicorn[standard]" apscheduler \
       "sqlalchemy[asyncio]" aiosqlite pywebpush python-dotenv
uv add --dev pytest pytest-asyncio httpx ruff
```

**Note:** Project initialization using this sequence is the first implementation story.

## Architectural Decisions Established by This Starter

**Language & Runtime:**
- Frontend: TypeScript 5, strict mode, ESModules
- Backend: Python 3.12+, managed by `uv`

**Styling Solution:**
- Tailwind CSS v4 via `@tailwindcss/vite` plugin — CSS-first config (no `tailwind.config.js`)
- shadcn/ui v4 — components copied into `src/components/ui/`, fully owned by the codebase

**Build Tooling:**
- Frontend: Vite 6 — dev server + production build + PWA manifest/service worker via `vite-plugin-pwa`
- Backend: Uvicorn — ASGI server; no build step

**Testing Framework:**
- Frontend: Vitest (included in Vite ecosystem)
- Backend: pytest + pytest-asyncio + httpx (for async FastAPI test client)

**Code Organization:**
- Frontend: feature-based under `src/features/`, shared components in `src/components/ui/` (shadcn), hooks in `src/hooks/`
- Backend: domain-based — `backend/app/routers/`, `backend/app/services/`, `backend/app/models/`, `backend/app/scheduler/`

**Development Experience:**
- Frontend: Vite HMR, TypeScript strict, ESLint + TypeScript rules
- Backend: `uv run uvicorn app.main:app --reload`, ruff for linting + formatting
- VAPID keys generated once at project init; stored in `.env` (not committed)

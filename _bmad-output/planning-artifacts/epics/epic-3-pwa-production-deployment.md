# Epic 3: PWA & Production Deployment

The app is installable to the home screen on iOS/Android, push notifications work on iOS Safari via PWA, and the app is publicly deployed on Railway with automatic HTTPS via Caddy and HTTP Basic Auth access control.

## Story 3.1: PWA Manifest & Service Worker

As a user,
I want to install the app to my home screen and have it behave like a native app,
So that I can launch it directly and receive push notifications on Android and desktop.

**Acceptance Criteria:**

**Given** `vite-plugin-pwa` is configured in `vite.config.ts`
**When** the frontend build runs (`npm run build`)
**Then** a `manifest.webmanifest` is generated in `frontend/dist/` with: `name: "Simple Todo"`, `short_name: "Todo"`, `display: "standalone"`, `background_color: "#18181b"` (zinc-900), `theme_color: "#8b5cf6"` (violet-500), icons at 192px and 512px

**Given** the PWA is served over HTTPS
**When** I visit the app in Chrome (Android or desktop)
**Then** the browser shows an "Add to Home Screen" / install prompt; installing places the app icon on the home screen

**Given** the app is installed and running as a standalone PWA
**When** a push notification job fires from APScheduler
**Then** the service worker receives the push event and calls `self.registration.showNotification()`; the notification appears on the device even when the app is backgrounded

**Given** the service worker is active
**When** I tap a notification
**Then** the `notificationclick` handler in `src/service-worker.ts` focuses or opens the app and posts the `task_id` for deep-link navigation; React Router resolves `/tasks/:taskId`

**Given** the app is updated and a new service worker is deployed
**When** a returning user opens the app
**Then** the new service worker activates without requiring a manual browser refresh (skipWaiting + clientsClaim configured)

---

## Story 3.2: iOS PWA Install Prompt

As a user on iPhone,
I want a clear in-app prompt guiding me to install the app via Safari before I set my first reminder,
So that push notifications work on iOS without me needing to know the Safari-specific installation requirement.

**Acceptance Criteria:**

**Given** I am on iOS Safari and have not yet installed the PWA
**When** I attempt to save a task with at least one offset selected for the first time
**Then** the `PWAInstallPrompt` component appears before the save completes, framed as "Enable reminders — install the app to your home screen"
**And** the prompt shows Safari-specific instructions: tap the Share icon → "Add to Home Screen"

**Given** the PWAInstallPrompt is showing
**When** I dismiss it without installing
**Then** the task is saved normally (without push subscription); the prompt does not re-appear on the same session; a non-blocking warning is shown: "Reminders won't fire until the app is installed"

**Given** I have already installed the PWA to my home screen
**When** I open the app from the home screen icon (standalone mode)
**Then** the PWAInstallPrompt never appears; push permission is requested normally on the first reminder-enabled save

**Given** the app is running in non-iOS browsers (Chrome Android, desktop)
**When** the first reminder-enabled save occurs
**Then** the PWAInstallPrompt is skipped entirely; the standard browser push permission prompt fires instead

**Given** the install state is detected
**When** I inspect the logic in `usePushSubscription.ts`
**Then** `window.navigator.standalone` (iOS) or `window.matchMedia('(display-mode: standalone)')` is used to detect installed state; detection happens before the permission flow

---

## Story 3.3: Caddy Configuration

As a developer,
I want Caddy configured to terminate HTTPS, enforce HTTP Basic Auth, and route traffic between the frontend and backend,
So that the production environment is secure and correctly wired before Railway deployment.

**Acceptance Criteria:**

**Given** a `Caddyfile` at the monorepo root
**When** Caddy starts
**Then** it serves the Vite build (`frontend/dist/`) for all non-API routes and proxies `/api/*` to `http://localhost:8000` (Uvicorn)

**Given** Caddy is running with HTTP Basic Auth configured
**When** I open the app URL without credentials
**Then** the browser shows a Basic Auth challenge; the app is inaccessible without the correct username and password
**And** credentials are set via Caddy environment variables (`CADDY_BASIC_AUTH_HASH`); not hardcoded in the Caddyfile

**Given** Caddy is running in production
**When** a request arrives over HTTP
**Then** Caddy automatically redirects to HTTPS and provisions a Let's Encrypt certificate for the domain

**Given** the frontend makes an API call in production
**When** the request hits Caddy
**Then** HTTPS is terminated at Caddy; FastAPI sees plain HTTP on localhost:8000; no CORS headers are needed in production (`ALLOWED_ORIGINS` is empty)

**Given** the Caddyfile is complete
**When** I run `caddy validate --config Caddyfile`
**Then** the config is valid with no errors; a `Caddyfile.example` with placeholder values is committed to the repo

---

## Story 3.4: Railway Deployment

As a user,
I want the app deployed to Railway at a public URL with a persistent database and working push notifications,
So that I can use it from my phone from anywhere.

**Acceptance Criteria:**

**Given** the Railway project is configured
**When** the backend service deploys
**Then** the start command runs `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000`; migrations apply before the app accepts traffic

**Given** Railway persistent volume is mounted at `/data/`
**When** the backend restarts or redeploys
**Then** the SQLite DB at `/data/simple-todo.db` persists; no tasks, subscriptions, or scheduler jobs are lost
**And** APScheduler jobs in the `apscheduler_jobs` table survive the restart and fire at their scheduled times

**Given** all environment variables are set in Railway
**When** the app starts
**Then** `DATABASE_URL`, `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIM_EMAIL`, `LLM_API_KEY`, `ALLOWED_ORIGINS` (empty string for production), and `CADDY_BASIC_AUTH_HASH` are all present; the app starts without errors

**Given** the app is deployed and I open the public URL in Safari on iPhone
**When** I follow the PWAInstallPrompt to install and grant push permission
**Then** I can create a task with a reminder offset, receive a push notification on my phone at the correct time, and tap it to open the task detail — the full end-to-end loop works in production

**Given** the deployment is live
**When** I check the Railway service logs
**Then** Uvicorn startup, Alembic migration completion, APScheduler start, and each scheduled notification dispatch are all logged; no unhandled exceptions at startup

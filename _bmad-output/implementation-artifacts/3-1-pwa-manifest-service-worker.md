# Story 3.1: PWA Manifest & Service Worker

Status: review

## Story

As a user,
I want to install the app to my home screen and have it behave like a native app,
so that I can launch it directly and receive push notifications on Android and desktop.

## Acceptance Criteria

1. **Given** `vite-plugin-pwa` is configured in `vite.config.ts`
   **When** the frontend build runs (`npm run build`)
   **Then** a `manifest.webmanifest` is generated in `frontend/dist/` with: `name: "Simple Todo"`, `short_name: "Todo"`, `display: "standalone"`, `background_color: "#18181b"` (zinc-900), `theme_color: "#8b5cf6"` (violet-500), icons at 192px and 512px

2. **Given** the PWA is served over HTTPS
   **When** I visit the app in Chrome (Android or desktop)
   **Then** the browser shows an "Add to Home Screen" / install prompt; installing places the app icon on the home screen

3. **Given** the app is installed and running as a standalone PWA
   **When** a push notification job fires from APScheduler
   **Then** the service worker receives the push event and calls `self.registration.showNotification()`; the notification appears on the device even when the app is backgrounded

4. **Given** the service worker is active
   **When** I tap a notification
   **Then** the `notificationclick` handler in `src/service-worker.ts` focuses or opens the app and posts the `task_id` for deep-link navigation; React Router resolves `/tasks/:taskId`

5. **Given** the app is updated and a new service worker is deployed
   **When** a returning user opens the app
   **Then** the new service worker activates without requiring a manual browser refresh (`skipWaiting` + `clientsClaim` configured)

## Tasks / Subtasks

- [x] Task 1: Add PWA manifest config to `vite.config.ts` (AC: 1, 2, 5)
  - [x] Add `manifest` object to `VitePWA()` config: `name`, `short_name`, `description`, `theme_color`, `background_color`, `display: "standalone"`, `start_url: "/"`, `scope: "/"`
  - [x] Add `icons` array with 192px and 512px entries pointing to `/icons/icon-192.png` and `/icons/icon-512.png`
  - [x] Verify `registerType: 'autoUpdate'` is already set (it is — this drives `skipWaiting` + `clientsClaim` automatically in injectManifest mode when using workbox config)
  - [x] Add `workbox: { skipWaiting: true, clientsClaim: true }` to the VitePWA config to explicitly enforce AC 5

- [x] Task 2: Generate PWA icons (AC: 1, 2)
  - [x] Create `frontend/public/icons/` directory
  - [x] Generate `icon-192.png` (192×192) — use the app's violet-500 (`#8b5cf6`) background with a simple checkmark or "T" on zinc-900 (`#18181b`), OR export from the existing `public/icons.svg`
  - [x] Generate `icon-512.png` (512×512) — same design at larger size
  - [x] Icons must be actual PNG files (not SVG) — manifest spec requires raster images for `purpose: "any maskable"` to work correctly
  - [x] Add `purpose: "any maskable"` to each icon entry in manifest so Android adaptable icons work

- [x] Task 3: Update `index.html` for PWA (AC: 1, 2)
  - [x] Change `<title>frontend</title>` to `<title>Simple Todo</title>`
  - [x] Add `<meta name="theme-color" content="#8b5cf6" />` for browser chrome color on Android
  - [x] Add `<meta name="description" content="Simple task manager with reminders" />`
  - [x] Add `<meta name="apple-mobile-web-app-capable" content="yes" />` for iOS (pre-iOS 16.4 Safari compatibility)
  - [x] Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />` for iOS status bar
  - [x] Add `<link rel="apple-touch-icon" href="/icons/icon-192.png" />` for iOS home screen icon

- [x] Task 4: Verify service worker push/notificationclick handlers are complete (AC: 3, 4) — READ-ONLY verification
  - [x] Read `frontend/src/service-worker.ts` — confirm `push` event handler calls `self.registration.showNotification(title, { body, data: { task_id: taskId } })` ✓ (already done in Story 2.6)
  - [x] Confirm `notificationclick` handler: closes notification, extracts `task_id`, focuses existing window or opens `/`, posts `{ type: 'NAVIGATE_TO_TASK', taskId }` message ✓ (already done in Story 2.7)
  - [x] Confirm `useDeepLink` hook in `src/hooks/useDeepLink.ts` is wired into `TaskList.tsx` ✓ (already done in Story 2.7)
  - [x] No code changes needed — this task is verification only

- [x] Task 5: Add `skipWaiting` + `clientsClaim` to service worker (AC: 5)
  - [x] Confirmed workbox config approach used: `workbox: { skipWaiting: true, clientsClaim: true }` in VitePWA options (Task 1)
  - [x] Verified no manual install/activate listeners in `service-worker.ts` — no duplication conflict

- [x] Task 6: Run build and verify manifest is generated (AC: 1)
  - [x] `cd frontend && npm run build` — build succeeded
  - [x] Confirmed `frontend/dist/manifest.webmanifest` exists with all correct fields (name, short_name, display, background_color, theme_color, icons)
  - [x] Confirmed `frontend/dist/icons/icon-192.png` and `icon-512.png` are in the dist output
  - [x] `npx vitest run` — all 32 tests pass (no regressions)

## Dev Notes

### What Is Already Implemented (Do NOT Reinvent)

**Already complete from prior stories — do NOT modify these:**
- `vite-plugin-pwa` installed (`v1.3.0`) and wired in `vite.config.ts` with `registerType: 'autoUpdate'`, `strategies: 'injectManifest'`, pointing at `src/service-worker.ts`
- `service-worker.ts` — full `push` event handler (Story 2.6) and `notificationclick` handler (Story 2.7)
- `useDeepLink.ts` hook in `src/hooks/useDeepLink.ts` — listens for `NAVIGATE_TO_TASK` messages from SW, calls `useNavigate()` (Story 2.7)
- `useDeepLink()` already called in `TaskList.tsx` (Story 2.7)
- React Router v7 routes including `/tasks/:taskId` → `TaskDetail` (Story 1.5)
- Workbox `precacheAndRoute(self.__WB_MANIFEST)` already in service worker

**This story's scope is narrow:** add the manifest config, generate the icons, update index.html, and confirm skipWaiting behavior.

### Current vite.config.ts VitePWA State

```typescript
// Current state (before this story):
VitePWA({
  registerType: 'autoUpdate',
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'service-worker.ts',
  devOptions: { enabled: true, type: 'module' },
})
```

**Add** the `manifest` and `workbox` fields — do not remove existing fields:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'service-worker.ts',
  devOptions: { enabled: true, type: 'module' },
  manifest: {
    name: 'Simple Todo',
    short_name: 'Todo',
    description: 'Simple task manager with reminders',
    theme_color: '#8b5cf6',
    background_color: '#18181b',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
  },
})
```

### Icon Generation

The project has `frontend/public/icons.svg` (not yet a directory). The icons directory needs to be created at `frontend/public/icons/`.

For generating PNG icons from SVG, use one of these approaches in order of preference:
1. **Node script** using `sharp` (if available): `npx sharp-cli -i public/icons.svg -o public/icons/icon-192.png --width 192 --height 192`
2. **Inline canvas**: Write a small Node.js script using `canvas` npm package
3. **Manual generation**: Create minimal solid-color PNG files programmatically using a base64 PNG approach (see below)

**Minimal approach using a Node.js script** — create `scripts/generate-icons.mjs` (temp file, delete after running):
```javascript
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'

function generateIcon(size, path) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  // Background: zinc-900
  ctx.fillStyle = '#18181b'
  ctx.fillRect(0, 0, size, size)
  // Circle: violet-500
  ctx.fillStyle = '#8b5cf6'
  ctx.beginPath()
  ctx.arc(size/2, size/2, size*0.38, 0, Math.PI*2)
  ctx.fill()
  // Checkmark in white
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = size * 0.07
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(size*0.35, size*0.52)
  ctx.lineTo(size*0.46, size*0.63)
  ctx.lineTo(size*0.65, size*0.40)
  ctx.stroke()
  writeFileSync(path, canvas.toBuffer('image/png'))
}

mkdirSync('public/icons', { recursive: true })
generateIcon(192, 'public/icons/icon-192.png')
generateIcon(512, 'public/icons/icon-512.png')
console.log('Icons generated.')
```

**Alternative — create icons using a simple base64 PNG if canvas isn't available:** create them using a Python script or any tool that writes valid 192x192 and 512x512 PNG files in the correct colors.

The exact visual design of the icon is not specified in the ACs beyond color. A solid violet-500 circle on zinc-900 background with a white checkmark matches the app's visual identity.

### skipWaiting Approach Decision

`vite-plugin-pwa` with `registerType: 'autoUpdate'` and `injectManifest` strategy:
- The `workbox: { skipWaiting: true, clientsClaim: true }` config option in vite.config.ts **injects** these calls into the built service worker automatically at build time via Workbox's build transform
- Do **NOT** also add `self.addEventListener('install', ...)` and `self.addEventListener('activate', ...)` manually in `service-worker.ts` — that would duplicate the behavior and may conflict
- Use the workbox config approach (Task 1) and skip Task 5's manual implementation path

### index.html Current State

```html
<!-- Current index.html — needs these changes: -->
<title>frontend</title>  <!-- CHANGE to "Simple Todo" -->
<!-- ADD: theme-color meta, description, apple meta tags, apple-touch-icon link -->
```

`vite-plugin-pwa` automatically injects the `<link rel="manifest" href="/manifest.webmanifest">` into the built HTML — you do **not** need to add that manually.

### Service Worker NavigateTo Task — Existing Implementation

The `notificationclick` handler in `src/service-worker.ts` already posts messages when an existing window is found:
```typescript
appWindow.postMessage({ type: 'NAVIGATE_TO_TASK', taskId })
return appWindow.focus().then(() => undefined)
```
And when no window is open, opens `/` and sends the message after 500ms delay:
```typescript
newWindow?.postMessage({ type: 'NAVIGATE_TO_TASK', taskId })
```

`useDeepLink.ts` in `src/hooks/` receives these messages and calls `navigate('/tasks/${taskId}')`. This entire chain is complete and tested — don't touch it.

### Files Being Modified

| File | Current State | Story 3.1 Changes |
|---|---|---|
| `frontend/vite.config.ts` | VitePWA without manifest config | ADD `manifest` + `workbox` fields to VitePWA config |
| `frontend/index.html` | Generic "frontend" title, no PWA metas | UPDATE title + ADD PWA meta tags |
| `frontend/public/icons/icon-192.png` | Does not exist | CREATE (192×192 PNG) |
| `frontend/public/icons/icon-512.png` | Does not exist | CREATE (512×512 PNG) |

**No backend changes.** **No changes to service-worker.ts.** **No changes to any React components.**

### Workbox + /api/* Non-Issue

A deferred concern from Story 1.1 noted "service worker may intercept `/api/*` fetches with default Workbox precache." With the `injectManifest` strategy, Workbox only precaches the static assets listed in `__WB_MANIFEST` — it does **not** add any fetch event handlers. Our `service-worker.ts` has no `fetch` event listener, so `/api/*` requests pass through to the network unchanged. No action needed on this story.

### Existing Tests to Preserve

Current test count: 32 tests (all passing as of Story 2.8). Run `cd frontend && npm test -- --run` to verify no regressions after config changes.

No new tests are required for this story — manifest generation is a build-time output (verified by inspecting `dist/`), and the icon files are static assets.

### References

- Epic requirements: [epic-3-pwa-production-deployment.md](../planning-artifacts/epics/epic-3-pwa-production-deployment.md) — Story 3.1 section
- Architecture: [core-architectural-decisions.md](../planning-artifacts/architecture/core-architectural-decisions.md) — Infrastructure & Deployment section
- Project structure: [project-structure-boundaries.md](../planning-artifacts/architecture/project-structure-boundaries.md) — `vite.config.ts`, `src/service-worker.ts`, `public/manifest.webmanifest`
- Existing service worker: `frontend/src/service-worker.ts`
- Existing VitePWA config: `frontend/vite.config.ts`
- Deep-link hook (already complete): `frontend/src/hooks/useDeepLink.ts`
- vite-plugin-pwa docs: `injectManifest` strategy with manifest field

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Added `manifest` + `workbox` config to VitePWA in `vite.config.ts` — manifest includes all required fields (name, short_name, display, colors, icons) and workbox config sets skipWaiting + clientsClaim.
- Generated `icon-192.png` (192×192) and `icon-512.png` (512×512) as valid PNG files using pure Python — violet-500 circle with white checkmark on zinc-900 background, `purpose: "any maskable"`.
- Updated `index.html`: title → "Simple Todo", added theme-color meta, description, apple-mobile-web-app metas, and apple-touch-icon link.
- Verified all service worker handlers (push, notificationclick, useDeepLink) were already complete from Stories 2.6/2.7 — no changes needed.
- Build produces `dist/manifest.webmanifest` with all correct fields; icons copied to `dist/icons/`.
- All 32 tests pass (0 regressions).

### File List

- frontend/vite.config.ts (modified — added manifest + workbox config to VitePWA)
- frontend/index.html (modified — updated title, added PWA meta tags)
- frontend/public/icons/icon-192.png (new — 192×192 PNG app icon)
- frontend/public/icons/icon-512.png (new — 512×512 PNG app icon)

### Change Log

- 2026-05-25: Story created — manifest config, icon generation, index.html PWA metas, skipWaiting via workbox config.
- 2026-05-25: Story implemented — all tasks complete, build produces manifest.webmanifest, 32/32 tests pass.

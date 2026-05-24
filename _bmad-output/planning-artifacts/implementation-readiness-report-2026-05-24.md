---
stepsCompleted: [step-01-document-discovery, step-02-prd-analysis, step-03-epic-coverage-validation, step-04-ux-alignment, step-05-epic-quality-review, step-06-final-assessment]
status: complete
documentsSelected:
  prd: "prds/prd-simple-todo-2026-05-22/prd.md"
  prd_addendum: "prds/prd-simple-todo-2026-05-22/addendum.md"
  architecture: "architecture.md"
  epics: "epics.md"
  ux: "ux-design-specification.md"
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-24
**Project:** simple-todo

## Document Inventory

| Type | File | Size | Modified |
|------|------|------|----------|
| PRD | `prds/prd-simple-todo-2026-05-22/prd.md` | 21,307 B | 2026-05-23 |
| PRD Addendum | `prds/prd-simple-todo-2026-05-22/addendum.md` | 2,713 B | 2026-05-23 |
| Architecture | `architecture.md` | 34,136 B | 2026-05-24 |
| Epics & Stories | `epics.md` | 59,012 B | 2026-05-24 |
| UX Design | `ux-design-specification.md` | 41,769 B | 2026-05-23 |

---

## PRD Analysis

### Functional Requirements

FR-1: Voice capture — User taps Voice FAB to initiate audio capture via Web Speech API. Listening indicator displayed while capturing. Capture ends on silence detection or manual stop. Indicator visible within 300ms; transcript sent within 1s of silence.

FR-2: AI parsing — System sends transcript to LLM and receives structured parse: `name`, `deadline` (date+time), `description` (if mentioned), `recurrence` (if mentioned). Parsed result on Confirmation Screen within 3s P90. If no deadline returned, field is blank and required before saving. Relative dates resolved against device current time.

FR-3: Confirmation Screen — All parsed fields displayed and editable before saving. Recurrence field shown if parsed; hidden otherwise (user can expose manually). Save button disabled until `name` and `deadline` are populated. Cancel returns user to task list with nothing saved.

FR-4: Reminder offset selection — On Confirmation Screen, user selects one or more of five preset Offsets (15 min, 30 min, 1 hr, 1 day, 2 days). Multi-select. No Offsets pre-selected by default. Past Offsets trigger a warning but do not block save. Zero Offsets is valid.

FR-5: Text fallback — User can create a Task by typing instead of speaking. Manual form has same fields and Offset selection as Confirmation Screen. No AI parsing — all fields filled manually.

FR-6: Task list view — Active (incomplete) Tasks sorted by Deadline ascending. Each row shows name and Deadline. Overdue Tasks visually distinguished and shown at top. List renders within 500ms of app open.

FR-7: Task completion — User can mark a Task complete. Completed Tasks move to archive (not deleted). All scheduled Reminders cancelled on completion. If part of a Series, next Instance auto-created.

FR-8: Task edit — User can edit any field of an existing Task from the task detail view. Saving reschedules Reminders based on updated Deadline and current Offsets. Recurrence pattern can be changed or removed.

FR-9: Task deletion — User can permanently delete a Task. For a Series Instance, user prompted: delete this Instance only, or end the Series (this + all future). Deleted Tasks are not recoverable. All scheduled Reminders cancelled.

FR-10: Recurrence specification via voice — User specifies Recurrence in voice utterance. LLM parses natural-language patterns into structured form. Supported: daily, weekly on named days, monthly on specific day-of-month. Parsed Recurrence shown on Confirmation Screen. If LLM cannot parse confidently, field is blank with inline note.

FR-11: Recurrence specification via UI — User can set or edit Recurrence manually on Confirmation Screen or edit view via picker: daily, weekly (day picker), monthly (day-of-month). Produces same structured representation as voice parsing.

FR-12: Auto-generation of next Instance — On Task completion, if part of a Series, system creates next Instance. Next Deadline = current Deadline + recurrence interval. Name, description, Recurrence, and Offsets copied from completed Instance. Next Instance appears immediately; Reminders scheduled automatically.

FR-13: End a Series — User can end a Series when deleting or from edit view. Options: (a) end after this Instance (complete it, no further Instances) or (b) delete this and all future Instances.

FR-14: Notification permission — On first Task save with at least one Offset selected, system requests browser push notification permission. Permission prompt fires exactly once. If denied, system warns that Reminders will not fire but allows save. Permission state persisted.

FR-15: Reminder scheduling — On Task save or edit, system schedules a push notification for each selected Offset. Scheduling is server-side so notifications fire even when browser tab is closed. Fire within ±60 seconds of scheduled time. On edit, prior notifications for that Task are cancelled before new ones created.

FR-16: Notification content — Push notification displays: Task name, time-to-deadline (e.g. "due in 1 hour"), and app name. Format: `{Task name} — due {relative time}`.

FR-17: Notification tap deep-link — Tapping notification opens app and navigates to that Task's detail view. If app is closed, it launches and routes to detail. If open on a different screen, it navigates to detail.

FR-18: Task list (home screen) — Default landing surface. Shows active Tasks sorted by Deadline. Voice FAB prominently placed (bottom-right). Archive access available (e.g. via header icon).

FR-19: Confirmation Screen (IA) — Shown after voice capture + parse. Not a persistent route — navigating away discards the draft.

FR-20: Task detail / edit view — Shown when tapping a Task or arriving via notification deep-link. Displays all fields; edit mode toggled from this view. Completion and deletion actions available.

FR-21: Archive view — Shows completed Tasks in reverse-completion order. No active Reminders shown. Tasks can be permanently deleted from archive.

**Total FRs: 21**

---

### Non-Functional Requirements

NFR-1 (Performance): Voice listening indicator visible within 300ms of FAB tap.

NFR-2 (Performance): Transcript sent for parsing within 1 second of silence detection.

NFR-3 (Performance): Confirmation Screen populated with parsed result within 3 seconds P90 after voice capture completes.

NFR-4 (Performance): Task list renders within 500ms of app open.

NFR-5 (Reliability): Push notifications fire within ±60 seconds of scheduled time.

NFR-6 (Reliability): Push notifications fire 99%+ of the time.

NFR-7 (Usability): End-to-end task creation (voice FAB tap → Task saved) under 15 seconds on golden path.

NFR-8 (Accuracy): Voice parse produces correct name + deadline without user edit more than 80% of the time.

NFR-9 (Deployment/Platform): App deployed as PWA (installable to home screen) to enable push notifications on iOS Safari. Onboarding prompts installation before first Reminder-enabled Task.

NFR-10 (Security/Access): No application-level authentication. HTTP Basic Auth at reverse proxy required for deployment.

NFR-11 (Connectivity): App requires network connectivity to function. Offline mode explicitly out of scope.

NFR-12 (Scheduling Architecture): Notification scheduling must be server-side so reminders fire when browser tab is closed.

**Total NFRs: 12**

---

### Additional Requirements / Constraints

- Single-user only — no multi-user, collaboration, or sharing in v1.
- No authentication at app level — access control is a deployment concern.
- Flat task model — no tags, labels, priorities, projects, sub-tasks, or checklists.
- No calendar sync, no email/SMS reminders — push notifications only.
- No snooze on notification in v1.
- Completed task retention policy not defined (PRD open question OQ-5).
- Overdue task additional notification behavior not defined (PRD open question OQ-4).
- Tech stack (LLM provider, scheduler) deferred to architecture phase; candidates in addendum.
- PWA installation onboarding flow mentioned in §6.1 but no explicit FR defined — potential story gap.

---

### PRD Completeness Assessment

The PRD is thorough and well-structured. Requirements are globally numbered (FR-1–FR-21), glossary-anchored, and tied to user journeys. Assumptions are tagged inline and indexed in §9. Open questions are explicitly surfaced in §8.

Minor gaps for validation in downstream steps:
- Completed task retention policy unresolved (OQ-5).
- Overdue task additional notification behavior unresolved (OQ-4).
- No data model NFRs (storage limits, max tasks) — acceptable for single-user scope.
- PWA onboarding flow referenced but lacks an explicit FR — may need a dedicated story.

---

## Epic Coverage Validation

### Coverage Matrix

| FR | PRD Requirement (summary) | Epic Coverage | Status |
|----|--------------------------|---------------|--------|
| FR-1 | Voice capture via Web Speech API | Epic 3 → Story 3.2 | ✅ Covered |
| FR-2 | AI parsing → structured parse P90 3s | Epic 3 → Story 3.1 & 3.3 | ✅ Covered |
| FR-3 | Confirmation Screen — all fields editable, save gated | Epic 1 → Story 1.4; Epic 2 → Story 2.3; Epic 3 → Story 3.3; Epic 4 → Story 4.2 | ✅ Covered |
| FR-4 | Offset selection (5 presets, multi-select, zero valid) | Epic 2 → Story 2.3 | ✅ Covered |
| FR-5 | Text fallback — manual form, no AI parsing | Epic 1 → Story 1.4 | ✅ Covered |
| FR-6 | Task list — sorted by deadline, overdue visual, 500ms render | Epic 1 → Story 1.3 | ✅ Covered |
| FR-7 | Task completion → archive; reminders cancelled; recurrence trigger | Epic 1 → Story 1.6 | ✅ Covered |
| FR-8 | Task edit — any field; reminders rescheduled | Epic 1 → Story 1.5 | ✅ Covered |
| FR-9 | Task deletion — confirm dialog; series prompt; reminders cancelled | Epic 1 → Story 1.7 | ✅ Covered |
| FR-10 | Recurrence via voice — LLM parses daily/weekly/monthly | Epic 4 → Story 4.3 | ✅ Covered |
| FR-11 | Recurrence via UI picker — daily/weekly/monthly | Epic 4 → Story 4.2 | ✅ Covered |
| FR-12 | Auto-generate next instance on completion | Epic 4 → Story 4.4 | ✅ Covered |
| FR-13 | End a series — end after this / delete all future | Epic 4 → Story 4.5 | ✅ Covered |
| FR-14 | Push permission — on first reminder-enabled save; state persisted | Epic 2 → Story 2.5; Epic 5 → Story 5.2 | ✅ Covered |
| FR-15 | Server-side scheduling; ±60s; reschedule on edit | Epic 2 → Story 2.1 & 2.4 | ✅ Covered |
| FR-16 | Notification content format | Epic 2 → Story 2.6 | ✅ Covered |
| FR-17 | Notification deep-link to task detail | Epic 2 → Story 2.7 | ✅ Covered |
| FR-18 | Task list home screen — Voice FAB bottom-right; archive access | Epic 1 → Story 1.3 | ✅ Covered |
| FR-19 | Confirmation Screen — not persistent route; navigating away discards | Epic 1 → Story 1.4 (and subsequent) | ✅ Covered |
| FR-20 | Task detail / edit view — deep-link target; completion + deletion | Epic 1 → Story 1.5 & 1.6 & 1.7 | ✅ Covered |
| FR-21 | Archive view — reverse-completion order; permanent delete | Epic 1 → Story 1.6 | ✅ Covered |

### NFR Coverage

| NFR | PRD Requirement | Epics Coverage | Status |
|-----|----------------|----------------|--------|
| NFR-1 | Listening indicator within 300ms | Epics NFR-1; Story 3.2 ACs | ✅ Covered |
| NFR-2 | Transcript sent within 1s of silence | Story 3.2 ACs ("immediately") | ✅ Covered |
| NFR-3 | Parse on Confirmation Screen within 3s P90 | Epics NFR-2; Story 3.1 ACs | ✅ Covered |
| NFR-4 | Task list renders within 500ms | Epics NFR-3; Story 1.3 ACs | ✅ Covered |
| NFR-5 | Notifications within ±60s | Epics NFR-4; Story 2.6 ACs | ✅ Covered |
| NFR-6 | Notifications fire 99%+ of the time | Epics NFR-4 | ✅ Covered |
| NFR-7 | Task creation under 15s (SM-1) | Not in epics NFRs — SM-level concern | ⚠️ Not in NFR list |
| NFR-8 | Voice parse 80%+ accuracy (SM-4) | Not in epics NFRs — SM-level concern | ⚠️ Not in NFR list |
| NFR-9 | PWA for iOS push; onboarding before first reminder save | Epics NFR-6; Story 5.1 & 5.2 | ✅ Covered |
| NFR-10 | HTTP Basic Auth at reverse proxy | Epics NFR-8; Story 5.3 | ✅ Covered |
| NFR-11 | Connectivity required; no offline mode | Epics NFR-7 | ✅ Covered |
| NFR-12 | Server-side scheduling | Epics AR-3; Story 2.1 | ✅ Covered |

**Additional NFR in epics not in PRD:** Epics NFR-5 adds WCAG 2.1 AA accessibility (from UX design spec) — this is a positive addition.

### Missing Requirements

No FRs are missing from the epics — all 21 are covered.

Two NFRs (NFR-7 and NFR-8) are not listed in the epics NFR section, but they are success metrics (SM-1, SM-4) from the PRD and are best validated through testing rather than implementation stories. This is an intentional structural choice, not a gap.

**Minor observations:**
- FR-3 (Confirmation Screen) is intentionally split across 4 epics as the screen evolves incrementally. Coverage is correct but the progressive enhancement pattern should be explicitly noted in story ACs — it is (each story's ACs describe the expected state of the screen at that epic stage).
- FR-19 (Confirmation Screen not a persistent route) is implicit in Story 1.4 ACs ("Cancel returns user to task list with nothing saved") — coverage is present but could be more explicit.

### Coverage Statistics

- Total PRD FRs: **21**
- FRs covered in epics: **21**
- FR Coverage: **100%**
- Total PRD NFRs: **12**
- NFRs explicitly in epics: **10** (NFR-7 and NFR-8 are SM-level, not implementation-level)
- NFR Coverage (implementation-relevant): **100%**

---

## UX Alignment Assessment

### UX Document Status

**Found:** `ux-design-specification.md` (42KB, 14 steps completed, status: complete). Comprehensive specification covering: executive summary, design system, color/typography, component strategy, user journey flows, accessibility, responsive strategy, and interaction patterns.

---

### UX ↔ PRD Alignment

**Well-aligned areas:**
- All three user journeys (UJ-1, UJ-2, UJ-3) from PRD §2.4 are mapped in full flowcharts in the UX spec with consistent paths and decision points.
- All 21 FRs have corresponding UX treatment — field layouts, component states, interaction patterns, and error recovery paths are defined.
- Non-goals are honored: no tabs, no sidebar, no auth UI, no calendar sync, no snooze, no sub-tasks.
- Single-user, phone-first design philosophy is consistent throughout.

**UX additions beyond PRD (all positive):**
- WCAG 2.1 AA accessibility target — adds contrast, keyboard, and screen-reader requirements not in PRD NFRs.
- Swipe-to-complete (left) and swipe-to-delete (right) gestures — aligned with one-handed mobile goal.
- Keyboard shortcut `V` to trigger VoiceFAB on desktop — sensible enhancement.
- `prefers-reduced-motion` support — accessibility best practice.
- Defined empty states (3 variants) and loading skeleton states — fills PRD gaps.

**UX/PRD minor gap:**
- PWA onboarding flow is detailed in UX spec (UX-DR8) but still lacks an explicit FR in the PRD. Story 5.2 fills this. Confirm Story 5.2 ACs use UX spec framing ("Enable reminders" — not "setup").

---

### UX ↔ Architecture Alignment

**Well-aligned areas:**
- All custom components (VoiceFAB, ConfirmationSheet, DeadlineChip, OffsetSelector, TrustBanner, PWAInstallPrompt, RecurrencePicker) have dedicated files in the architecture's frontend directory structure.
- React Router v7 routes match UX navigation: `"/"`, `"/tasks/:taskId"`, `"/archive"`.
- Zustand store covers UX state: `confirmationSheetOpen`, `activeTaskId`, `trustBannerMessage`.
- Radix UI primitives (shadcn/ui) provide WCAG 2.1 AA baseline — keyboard nav, focus traps, ARIA roles.
- `useDeepLink.ts` handles `notificationclick` → navigate to `/tasks/:taskId` per UJ-3.
- Performance constraints (< 500ms list, < 3s parse P90) supported by TanStack Query + async FastAPI.

**Misalignment #1 — Tailwind Version (⚠️ Medium awareness issue):**
- UX spec "Design System Choice" section explicitly states **"Tailwind CSS v3 + shadcn/ui"** and describes `tailwind.config.js`-based token configuration.
- Architecture commits to **Tailwind v4** (CSS-first, `@tailwindcss/vite`, no `tailwind.config.js`).
- **Impact:** Developer must translate UX token table to v4 `@theme` CSS syntax. The design intent is identical; only configuration method differs. Not a blocker.
- **Recommendation:** Story 1.3 (Frontend Foundation) should explicitly note this v3→v4 translation when implementing the design token system.

**Misalignment #2 — Archive Navigation Pattern (⚠️ Low):**
- UX spec: *"Home → Archive: Header icon → sheet slides up"* — Archive is a sheet.
- Architecture router: defines `"/archive"` as a full route (`ArchiveView.tsx`).
- Epics Story 1.6 ACs: *"a sheet slides up (not a push navigation)"* — consistent with UX spec.
- **Impact:** Route `"/archive"` in architecture may be unused if Archive is always a sheet. Deep-linking to `/archive` is not a defined use case.
- **Recommendation:** Clarify in Story 1.6 whether the `/archive` route is needed. If Archive is sheet-only, the route can be removed to avoid a dead URL.

---

### Warnings

- No critical architectural gaps preventing UX implementation.
- Tailwind v3/v4 discrepancy is a developer awareness issue, not a blocker.
- Archive route vs. sheet: epics Story 1.6 ACs are authoritative (sheet); architecture route is an optional addition.

---

## Epic Quality Review

### Review Summary

**Epics:** 5 epics, 19 stories reviewed.
**Critical violations:** 0
**Major issues:** 2
**Minor concerns:** 4

---

### Epic-by-Epic Compliance Checklist

| Epic | Delivers User Value | Independently Completable | Stories Sized Right | No Forward Dependencies | ACs Testable | FR Traceability |
|------|--------------------|--------------------------|--------------------|------------------------|-------------|-----------------|
| Epic 1: Task Management Foundation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Epic 2: Push Notifications & Reminders | ✅ | ✅ (needs E1) | ✅ | ✅ | ✅ | ✅ |
| Epic 3: Voice Capture & AI Parsing | ✅ | ✅ (needs E1) | ✅ | ✅ | ✅ | ✅ |
| Epic 4: Recurring Tasks | ✅ | ✅ (needs E1; S4.3 needs E3) | ✅ | ✅ | ✅ | ✅ |
| Epic 5: PWA & Production Deployment | ✅ | ✅ (needs E1-4) | ✅ | ✅ | ✅ | ✅ |

### Epic Independence Validation

- **Epic 1** stands completely alone — no external dependencies. Full CRUD app without reminders. ✅
- **Epic 2** requires Epic 1 task CRUD. Text creation must exist before reminder scheduling can be tested. Correct dependency order. ✅
- **Epic 3** requires Epic 1 (text fallback remains available; voice is an enhancement). Does not require Epic 2. ✅
- **Epic 4 Stories 4.1–4.2, 4.4–4.5** require Epic 1 only. **Story 4.3** (Recurrence via Voice) requires Epic 3 infrastructure — this is a backward dependency (Epic 3 precedes Epic 4 in sequence). ✅
- **Epic 5** requires all prior epics. Deployment validates the complete app. Correct. ✅

### Starter Template Check

Architecture specifies a starter template with a defined init sequence. **Story 1.1 is exactly "Project Initialization & Running Skeleton"** — includes cloning, dependency installation, Alembic migration, VAPID key generation, and smoke tests. ✅ Meets requirement.

---

### 🔴 Critical Violations

**None found.**

---

### 🟠 Major Issues

**Issue M-1: Ambiguous column type in Story 2.3 AC**

Story 2.3 ACs state: *"they are persisted as an array of integer minutes: [15, 30, 60, 1440, 2880]; the `tasks` table gains an `offsets` column (JSON or comma-separated integers)"*

The "JSON or comma-separated integers" formulation is ambiguous. Architecture AR-11 says *"Reminder offsets stored as integer minutes"* without specifying the column type. The epics AR-11 also says *"stored as array of integer minutes."* This leaves the implementation decision to the developer, which can cause inconsistency (SQLite JSON column vs. text column) and affects the query pattern.

- **Story affected:** Story 2.3
- **Impact:** If one developer uses JSON and another reads it as text, the API serialization layer breaks silently.
- **Recommendation:** Specify `JSON` column type explicitly in Story 2.3 ACs. SQLAlchemy's `JSON` type on SQLite stores as text but deserializes correctly. Update to: *"the `tasks` table gains an `offsets` column (SQLAlchemy JSON type, stored as a JSON array of integers)"*.

**Issue M-2: "As a developer" stories pattern (7 of 19 stories)**

Stories 1.1, 1.2, 2.1, 2.2, 3.1, 4.1, and 5.3 are written as developer stories ("As a developer, I want…") with no direct user-facing value. This is **37% of all stories**.

- **Stories affected:** 1.1, 1.2, 2.1, 2.2, 3.1, 4.1, 5.3
- **Assessment:** For a greenfield project this pattern is expected — infrastructure must be built before user value can be delivered. Story 1.1 is explicitly required by the framework's starter template rule. Stories 1.2, 2.1, 2.2, 3.1, 4.1 follow the correct "API foundation → UI on top" incremental approach. Story 5.3 is pure ops.
- **Verdict:** **Acceptable for this project type** given the API-first architecture and greenfield nature. Not a defect, but the project owner should understand these stories deliver zero testable user value alone — they must be followed by their corresponding user-facing stories before the epic delivers value.
- **Recommendation:** No change needed. Document awareness: each developer story pairs with a specific user story in the same epic that validates the developer story's output.

---

### 🟡 Minor Concerns

**Concern 1: FR-19 testability gap**

FR-19 requires: *"Confirmation Screen is not a persistent route — navigating away discards the draft."* Story 1.4 ACs cover Cancel behavior ("Cancel or swipe the sheet down → sheet dismisses and task list is unchanged") but do not explicitly test the case where the user navigates away via browser back or hard refresh.

- **Story affected:** Story 1.4
- **Recommendation:** Add an AC to Story 1.4: *"Given the ConfirmationSheet is open, When the user navigates away (browser back, route change), Then the sheet closes and no task is saved."*

**Concern 2: Story 2.3 modifies an existing component without explicit framing**

Story 2.3 adds the OffsetSelector to the ConfirmationSheet, which was built in Story 1.4 without offset selection. The story doesn't mention it's modifying an existing component — it describes the component as if new. A developer reading 2.3 without 1.4 context might try to rebuild the sheet.

- **Story affected:** Story 2.3
- **Recommendation:** Add a context line in the story preamble: *"This story enhances the ConfirmationSheet component built in Story 1.4 by adding the OffsetSelector section below the existing form fields."*

**Concern 3: Story 4.5 introduces a new endpoint not established in Story 4.1**

Story 4.5 requires `DELETE /api/v1/tasks/{id}/series` — an endpoint not listed in the architecture's key endpoints table (which lists only `DELETE /api/v1/tasks/{id}`). The endpoint is created in the story's implementation. This is technically correct (JIT endpoint creation) but the architecture's endpoint table is incomplete.

- **Story affected:** Story 4.5 / Architecture document
- **Recommendation:** Minor doc alignment: note in Story 4.1 that `DELETE /api/v1/tasks/{id}/series` will be added in Story 4.5, or update the architecture endpoint table to include it.

**Concern 4: Epic 5 has no explicit dependency notation**

Epic 5 implicitly requires the full working app (Epics 1-4), but this dependency is not documented anywhere in the epic description. A developer picking up Epic 5 stories in isolation (e.g., Story 5.1: PWA Manifest) could proceed without the app being functional.

- **Epic affected:** Epic 5
- **Recommendation:** Add to Epic 5 description: *"Prerequisites: Epics 1–4 must be complete. All features must be working end-to-end before production deployment is meaningful."*

---

### Acceptance Criteria Quality Assessment

All stories use proper **Given/When/Then (BDD) format**. ✅

Sampling across epics confirms:
- Happy path coverage: ✅ All stories cover the primary success scenario
- Error conditions: ✅ Stories 2.5 (permission denied), 3.4 (voice errors), 2.7 (deleted task deep-link) cover edge cases
- Performance criteria: ✅ Stories 1.3 (500ms), 3.1 (P90 3s), 2.6 (±60s) include measurable outcomes
- Accessibility criteria: ✅ Stories 2.3, 3.2, 1.3 include specific ARIA and focus-ring requirements

**One AC-level gap:** Story 5.2 AC says *"the PWAInstallPrompt component appears before the save completes"* — this timing is ambiguous. Does it block the save API call? Does it appear after the sheet closes? The UX spec says it should appear before push permission is requested, on the first Reminder-enabled save. Recommend clarifying: *"the PWAInstallPrompt appears as a pre-save modal, blocking the POST /api/v1/tasks/ call until the user dismisses it."*

### Database Creation Timing

Validating JIT (just-in-time) table creation:

| Table | First created | Epic/Story | Assessment |
|-------|--------------|------------|------------|
| `tasks` | Story 1.2 | Epic 1 | ✅ JIT — tasks are the Epic 1 core entity |
| `apscheduler_jobs` | Story 2.1 | Epic 2 | ✅ JIT — only needed when scheduling begins |
| `push_subscriptions` | Story 2.2 | Epic 2 | ✅ JIT — only needed for push pipeline |
| `offsets` column on tasks | Story 2.3 | Epic 2 | ✅ JIT — added when offset selection is built |
| `recurrence` + `series_id` columns on tasks | Story 4.1 | Epic 4 | ✅ JIT — added when recurring task feature begins |

No tables created speculatively ahead of when they're needed. ✅

---

## Summary and Recommendations

### Overall Readiness Status

## ✅ READY FOR IMPLEMENTATION

The planning artifacts for simple-todo are coherent, complete, and aligned. No critical violations were found. All 21 Functional Requirements have full coverage in the epics. The UX specification and architecture are well-integrated with two minor misalignments that pose no implementation risk. The six issues found are all fixable with targeted, surgical edits — none require rework of epics or architecture.

---

### Issues Summary

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | 🟠 Major | Story 2.3 | Ambiguous `offsets` column type ("JSON or comma-separated integers") |
| 2 | 🟠 Major | All "developer" stories | 7 of 19 stories have no direct user value — acceptable for greenfield |
| 3 | ⚠️ UX/Arch | UX spec vs Architecture | Tailwind v3 reference in UX spec; architecture uses v4 |
| 4 | ⚠️ UX/Arch | UX spec vs Architecture | Archive described as sheet in UX/epics; defined as route in architecture |
| 5 | 🟡 Minor | Story 1.4 | FR-19 testability gap — "navigate away discards draft" not explicitly tested |
| 6 | 🟡 Minor | Story 2.3 | Missing context that it modifies ConfirmationSheet from Story 1.4 |
| 7 | 🟡 Minor | Story 4.5 / Architecture | `DELETE /api/v1/tasks/{id}/series` endpoint not in architecture endpoint table |
| 8 | 🟡 Minor | Epic 5 | No explicit prerequisite notation (requires Epics 1–4 complete) |
| 9 | 🟡 Minor | Story 5.2 | AC timing for PWAInstallPrompt is ambiguous — "before save completes" needs precision |

---

### Critical Issues Requiring Immediate Action

**None.** No critical issues block implementation start.

---

### Recommended Next Steps

**Before writing the first line of code:**

1. **Fix Issue #1 (Story 2.3 — offsets column type):** Update AC to specify: *"`tasks` table gains an `offsets` column (SQLAlchemy `JSON` type, stored as JSON array of integers: `[15, 30, 60, 1440, 2880]`)"*. This removes implementation ambiguity on day one.

2. **Clarify Archive navigation (Issue #4):** Decide once: is `/archive` a route or always a sheet? Epics Story 1.6 ACs say sheet — follow that. Remove or note the `/archive` route in `router.tsx` accordingly. Add a comment in the architecture doc.

3. **Add FR-19 AC to Story 1.4 (Issue #5):** Add: *"Given the ConfirmationSheet is open, When the user navigates away without saving, Then the sheet closes and no task is saved."* One line, preserves testability.

**During implementation:**

4. **Tailwind v4 token translation (Issue #3):** When Story 1.3 implements the design system, translate the UX spec's token table into v4 `@theme` CSS syntax. The design intent is identical; only the configuration mechanism differs from the v3 reference in the UX spec.

5. **Story 2.3 context note (Issue #6):** Before implementing Story 2.3, remind the developer it enhances the ConfirmationSheet from Story 1.4 — not a new component.

6. **Story 5.2 timing precision (Issue #9):** Before implementing the iOS PWA Install Prompt, clarify: prompt appears as a pre-save gate (blocks the API call) or as a post-save suggestion? UX spec implies pre-save. Confirm and update the AC.

**Low priority / optional:**

7. Add Epic 5 prerequisite notation: *"Prerequisites: Epics 1–4 complete and working end-to-end."*
8. Add `DELETE /api/v1/tasks/{id}/series` to architecture endpoint table for completeness.

---

### Strength of Planning Artifacts

This is an unusually strong planning foundation:
- **PRD:** 21 FRs globally numbered, glossary-anchored, with explicit assumptions (A-1–A-7) and indexed open questions (OQ-1–OQ-6). 100% requirements coverage in epics.
- **Architecture:** Complete file tree, naming conventions, enforcement rules, and anti-patterns documented. Notification lifecycle is addressed as a mandatory cross-cutting concern on every task mutation.
- **UX Spec:** Comprehensive enough to guide implementation without ambiguity on component states, interactions, and accessibility targets.
- **Epics:** 19 stories across 5 epics with BDD acceptance criteria. JIT database creation throughout. Full FR traceability maintained.

The 9 issues found are refinements, not gaps. The planning artifacts are ready to hand to an implementation agent today.

---

### Final Note

**Assessor:** Implementation Readiness Skill, BMad Method v6.7.1
**Date:** 2026-05-24
**Report:** `_bmad-output/planning-artifacts/implementation-readiness-report-2026-05-24.md`

This assessment identified **9 issues** across **3 severity categories**. Zero critical issues. Address Issues #1–3 (the two majors and the Tailwind clarification) before the first implementation story is written. The remaining 6 can be addressed inline during development. These findings are intended to sharpen the artifacts — the core planning work is solid and implementation-ready.


---
title: "Simple Todo App"
status: final
created: 2026-05-22
updated: 2026-05-22
---

# Product Brief: Simple Todo App

## Executive Summary

Simple Todo is a personal task management app built on React and FastAPI, designed around a single insight: most todo apps treat reminders as a feature add-on, but for the people who actually need them, reminders _are_ the app. The core interaction is frictionless — speak a task naturally, confirm what the AI parsed, and trust that the right notification will arrive at the right time. No categories, no priorities, no organizational overhead.

The project serves two purposes simultaneously: a genuinely useful personal productivity tool for a phone-reliant, fast-moving user, and a deliberate learning vehicle for the BMad Method. The artifacts produced here — this brief, the PRD, architecture, and stories — are meant to be reusable templates for future projects.

## The Problem

Todo apps fail their users in two ways. First, they make creation slow — typing on mobile is friction, and friction means tasks go unlogged. Second, they bury the reminder under layers of optional fields, categories, and priority flags that nobody asked for. The result: a beautiful, empty app and a head still full of things to remember.

The user this app is built for is phone-reliant and practical. They don't want to organize tasks — they want to _not forget_ them. The status quo is Apple Reminders or Google Tasks: functional but generic, and not worth opening when you could just keep it in your head.

## The Solution

A voice-first personal task manager where speaking creates a task and push notifications ensure the task surfaces at the right moment.

The interaction loop is intentionally short:

1. **Speak.** User taps the mic and says "remind me to call the dentist Thursday at 10am."
2. **Confirm.** AI parses the input into task name, deadline, and optional description. A confirmation screen surfaces the parsed result — user edits if wrong, saves if right.
3. **Done.** Task is stored. User selects reminder offset(s) — 15 minutes, 30 minutes, 1 hour, 1 day, or 2 days before deadline. Multiple offsets supported.
4. **Get reminded.** Push notification fires at the scheduled time. No email, no SMS, no noise.

The app's task model is deliberately lean: `name` (required), `deadline` (required), `description` (optional). Nothing else is mandatory. Recurring tasks are supported for predictable commitments.

## What Makes This Different

The differentiator is not the feature set — it is the design priority. Every decision in this app subordinates organization to recall. Voice-first creation removes the friction that causes tasks to go unlogged. Preset reminder offsets remove the "when exactly?" decision fatigue. Minimal task anatomy means there is no setup cost per task.

The honest moat is execution: a clean, fast, voice-driven experience that the user actually reaches for instead of defaulting to their phone's built-in tool.

## Who This Serves

**Primary user: the builder himself.** Phone-reliant, practical, high task volume, low tolerance for UI friction. Needs to capture fast, trust the reminder, and move on. Does not want to curate a task system — wants a reliable memory prosthetic.

No secondary users in v1. Single-user, no accounts, no sharing.

## Success Criteria

**For the app:**

- Voice input parses task name and deadline with high accuracy; confirmation screen catches parsing errors
- Push notifications fire reliably at scheduled times
- End-to-end task creation (voice → confirm → save) takes under 15 seconds
- App is used in preference to Apple Reminders or Google Tasks within two weeks of first use

**For the learning goal:**

- User can open Claude Code, run the BMad agents end-to-end, and produce full planning artifacts (brief → PRD → architecture → stories) through to development start — without external tutorials, videos, or hand-holding
- Artifacts from this project serve as reusable templates for future projects

## Scope

**In for v1:**

- Voice input → AI natural language parsing → confirmation screen → save
- Full CRUD for tasks (`name`, `deadline`, `description`)
- Recurring tasks
- Push notifications with preset reminder offsets (15 min, 30 min, 1 hr, 1 day, 2 days before deadline)
- Multiple reminders per task
- Single-user, no authentication

**Explicitly out of v1:**

- Collaboration and task sharing
- Categories, tags, priorities
- Multiple lists or projects
- Calendar sync (Google Calendar, Apple Calendar)
- Email or SMS reminders

## Tech Stack

- **Frontend:** React
- **Backend:** FastAPI (Python)
- **Reminders:** APScheduler or Celery (TBD in architecture phase)
- **Voice / AI parsing:** Web Speech API (capture) + LLM call (parse)
- **Notifications:** Browser push notifications

## Vision

A reliable personal tool the builder actually uses, and a portfolio piece that demonstrates full-stack development and end-to-end product thinking. The app has no commercial ambitions — the todo space is saturated — but it earns its place as a well-built, genuinely used artifact of the learning process.

---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'Simple Todo App — React frontend + FastAPI Python backend'
session_goals: 'Learn the BMad Method end-to-end by building a real working app; produce a personal task management tool with create, read, update, delete todo capabilities'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking']
ideas_generated: 4
technique_execution_complete: true
facilitation_notes: 'User is highly practical and phone-reliant. Minimal feature set preferred. Reminders are the core value proposition, not task organization.'
---

# Brainstorming Session Results

**Facilitator:** Mary (Business Analyst)
**Date:** 2026-05-22

## Session Overview

**Topic:** Simple Todo App — React (frontend) + FastAPI Python (backend)
**Goals:** Learn the BMad workflow by shipping a real app; end product is a personal task management tool for organizing and maintaining tasks

### Session Setup

User is exploring the BMad Method for the first time using a simple todo application as the learning vehicle. Tech stack is anchored: React for UI, FastAPI (Python) for the backend API. Scope is intentionally kept simple — core CRUD operations for task management.

---

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Simple Todo App with focus on learning BMad while building a real personal task manager

**Recommended Techniques:**
- **First Principles Thinking:** Strip assumptions, define what the app truly needs to be
- **SCAMPER Method:** Systematic feature ideation across 7 lenses
- **What If Scenarios:** Push into novel territory with radical questions

**AI Rationale:** Familiar/concrete domain benefits from First Principles to avoid "obvious feature trap," followed by structured SCAMPER for feature breadth, then What If for differentiation.

---

## Technique Execution Results

### First Principles Thinking (Completed)

**Interactive Focus:** What does a todo app fundamentally exist to do? What is the minimum viable task anatomy?

**Ideas Generated:**

**[Foundation #1]**: Memory Prosthetic
*Concept:* The todo app's core job isn't organization — it's offloading the cognitive burden of remembering. The list itself is secondary; the reminder at the right moment is the actual product.
*Novelty:* Most todo apps treat reminders as a feature add-on. For this user, reminders ARE the app. Everything else serves that.

**[Foundation #2]**: Preset Reminder Menu
*Concept:* Instead of making users type a custom time, offer a curated pick-list — 15 min, 1 hour, 1 day, 2 days before deadline. One tap, done. The app handles the scheduling math. FastAPI stores the deadline and selected offset(s), not a fixed timestamp.
*Novelty:* Removes "when exactly?" decision fatigue. Fast to set, reliable to execute.

**[Foundation #3]**: Push Notification as Primary Channel
*Concept:* The app's reminder delivery relies on push notifications to the user's device. No email, no SMS, no elaborate fallback chain — just a clean browser/mobile notification.
*Novelty:* Keeps the backend simple. FastAPI runs a scheduler (APScheduler or Celery) that fires notifications at the right time. No third-party costs.

**[Foundation #4]**: Minimal Task Anatomy
*Concept:* A task has exactly three fields — `name` (required), `deadline` (required), `description` (optional). Nothing else is mandatory. No tags, no priorities, no categories forced on the user.
*Novelty:* Respects that the user wants to capture and go. The FastAPI model is intentionally lean and fast to interact with.

**Key Breakthrough:** The app's primary value is combating forgetfulness via timely reminders — not visual organization. This inverts the typical todo app design priority.

### SCAMPER Method — Not started (session ended by user)
### What If Scenarios — Not started (session ended by user)

---

## Session Summary

### Your App's First Principles (confirmed)

1. **Core job** = combat forgetfulness, not organize tasks
2. **Reminders are the product** — preset options (15 min, 1 hr, 1 day, 2 days before deadline)
3. **Multiple reminders per task** supported
4. **Push notification** is the delivery channel
5. **Minimum task** = `name` (required) + `deadline` (required) + `description` (optional)

### Recommended Next BMad Step

With these first principles established, the natural next step is to move into **Product Brief** creation (Mary's CB menu item) or jump straight into **PRD creation** with the product manager agent (John). The foundation from this session feeds directly into those artifacts.

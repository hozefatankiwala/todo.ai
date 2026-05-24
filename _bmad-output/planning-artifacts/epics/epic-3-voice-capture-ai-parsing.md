# Epic 3: Voice Capture & AI Parsing

User can tap the Voice FAB, speak naturally, and see the AI-parsed task pre-filled on the Confirmation Screen. Voice is the primary creation path; text fallback remains available.

## Story 3.1: LLM Parse Endpoint

As a developer,
I want a backend endpoint that accepts a voice transcript and returns structured task fields,
So that the frontend can send raw speech and receive a ready-to-display parse result.

**Acceptance Criteria:**

**Given** the API is running
**When** I call `POST /api/v1/parse` with `{"transcript": "Call the dentist Thursday at 10am"}`
**Then** it returns (200) a JSON object with: `name` (string), `deadline_at` (UTC ISO 8601 or null), `description` (string or null), `recurrence` (null at this stage)
**And** relative date expressions ("Thursday", "next week", "in 2 hours") are resolved against the server's current UTC time at parse time

**Given** the LLM provider is configured
**When** I inspect `llm_service.py`
**Then** the provider is abstracted behind a single `parse_transcript(transcript: str) -> ParsedTask` function; the concrete provider (Claude/GPT-4o/Gemini) is selected via `LLM_PROVIDER` env var; `LLM_API_KEY` is read from environment, never hardcoded

**Given** the LLM returns a response without a parseable deadline
**When** the endpoint responds
**Then** `deadline_at` is `null` in the response; no error is raised; the frontend handles the null by showing the empty DeadlineChip state

**Given** the LLM API call fails (network error, timeout, rate limit)
**When** the endpoint is called
**Then** it returns `{"detail": "Parse failed — try again or type instead", "code": "LLM_PARSE_FAILED"}` (502)
**And** the error is logged server-side; the response time stays under 5 seconds before returning the error

**Given** the parse endpoint is called
**When** I inspect the response time
**Then** P90 response time is under 3 seconds for a typical short transcript

---

## Story 3.2: Voice FAB & Web Speech API

As a user,
I want to tap the Voice FAB and speak a task naturally with clear visual feedback at every step,
So that I always know whether the app is listening, processing, or has encountered an error.

**Acceptance Criteria:**

**Given** the task list is visible
**When** I view the FAB
**Then** it shows the resting state: `bg-violet-500 rounded-full h-14 w-14 fixed bottom-6 right-6 z-50` with a mic icon; `aria-label="Add task by voice"` and `role="button"`

**Given** I tap the Voice FAB for the first time
**When** the browser requests microphone access
**Then** the browser's native mic permission prompt appears with a contextual explanation visible in the app UI; the FAB stays in resting state until permission is granted

**Given** mic permission is granted
**When** I tap the Voice FAB
**Then** the FAB transitions to listening state within 300ms: double pulse ring animation, waveform indicator, "Listening…" label
**And** `aria-live="polite"` announces the state change to screen readers

**Given** the FAB is in listening state
**When** silence is detected (1 second) or I tap the FAB again to stop manually
**Then** the FAB transitions to processing state: spinner replaces mic icon, "Thinking…" label, no pulse ring
**And** the transcript is sent to `POST /api/v1/parse` immediately

**Given** the FAB is in processing state and the LLM parse succeeds
**When** the response arrives
**Then** the FAB returns to resting state and the ConfirmationSheet opens with pre-filled values (handled in Story 3.3)

**Given** the FAB is in processing or listening state and an error occurs
**When** the error is detected
**Then** the FAB briefly flashes red then returns to resting state within 500ms; the error is surfaced inline (handled in Story 3.4)

---

## Story 3.3: Confirmation Sheet with Voice Prefill

As a user,
I want the Confirmation Sheet to open pre-filled with the AI-parsed task name, deadline, and description after I speak,
So that I can verify the parse result and save in one tap when it is correct.

**Acceptance Criteria:**

**Given** the LLM parse returns `{name: "Call the dentist", deadline_at: "2026-06-05T10:00:00Z", description: null}`
**When** the ConfirmationSheet opens
**Then** the NameField card is pre-filled with "Call the dentist"; the DeadlineChip shows "Thu, Jun 5 · 10:00 AM" (local time); description is empty

**Given** the ConfirmationSheet is open with pre-filled values
**When** I review the parsed deadline
**Then** the DeadlineChip is tappable and opens a date/time picker if I need to correct the value; editing is inline with no separate edit mode

**Given** the parsed name is incorrect
**When** I tap the NameField card
**Then** the field is immediately editable; the keyboard opens; I can correct the name before saving

**Given** the LLM returns `deadline_at: null`
**When** the ConfirmationSheet opens
**Then** the DeadlineChip shows the empty state (amber border + "Tap to set deadline"); Save remains disabled until I set a deadline manually

**Given** the ConfirmationSheet is pre-filled and I have selected offsets
**When** I tap Save
**Then** `POST /api/v1/tasks/` is called with the final (possibly corrected) values; the flow is identical to text creation from this point onward (sheet dismisses, task appears in list, TrustBanner shows)

**Given** the text fallback option
**When** voice is available and the ConfirmationSheet is open
**Then** a "Type instead" text link is visible; tapping it clears the pre-filled values and opens the same sheet in manual-entry mode (keyboard opens on NameField)

---

## Story 3.4: Voice Error Handling & Text Fallback

As a user,
I want clear recovery options when voice capture or AI parsing fails,
So that I am never left at a dead end and can always create a task by another path.

**Acceptance Criteria:**

**Given** I tap the Voice FAB but speak nothing (silence timeout)
**When** the timeout triggers
**Then** the FAB returns to resting state and an inline message appears: "Nothing heard — tap to try again"; no sheet opens

**Given** I tap the Voice FAB and mic permission is denied
**When** the denial is detected
**Then** an inline non-blocking warning appears: "Microphone access denied — tap to type instead"; tapping the warning opens the ConfirmationSheet in manual text-entry mode
**And** the FAB returns to resting state; no further mic prompt is shown

**Given** the transcript is sent to `POST /api/v1/parse` and the network request fails
**When** the error response (502) is received
**Then** the FAB returns to resting state; an inline error card appears with two actions: "Try again" (re-sends the same transcript) and "Type instead" (opens the ConfirmationSheet in manual mode)

**Given** the LLM returns a result but the name field is empty or unparseable
**When** the ConfirmationSheet opens
**Then** the NameField is empty and auto-focused; the DeadlineChip shows whatever was parsed (or empty); Save is disabled until name is filled — user completes manually

**Given** any error state is showing
**When** I tap "Type instead"
**Then** the ConfirmationSheet opens in manual-entry mode with all fields empty and the keyboard focused on NameField; the error message is dismissed

---

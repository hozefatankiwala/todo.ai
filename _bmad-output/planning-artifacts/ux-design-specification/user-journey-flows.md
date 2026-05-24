# User Journey Flows

## UJ-1: Capture a Task by Voice

```mermaid
flowchart TD
    A([App open · Task list]) --> B[Tap Voice FAB]
    B --> C{Mic permission?}
    C -- First time --> D[Permission prompt\ncontextual explanation]
    D -- Granted --> E[Listening state\npulse ring + waveform]
    D -- Denied --> F[Warning banner\n'Reminders won't fire'\nOffer text entry]
    C -- Already granted --> E
    E --> G{Speech detected?}
    G -- Yes, silence detected --> H[Processing state\nspinner · 'Thinking…']
    G -- Manual stop tap --> H
    G -- No speech · timeout --> I[Error state\n'Nothing heard'\nTap to retry]
    I --> B
    H --> J{LLM parse result}
    J -- Success --> K[Confirmation Sheet slides up\nname · deadline chip · offset chips]
    J -- Network error --> L[Error card\n'Couldn't process'\nType instead / Retry]
    K --> M{User reviews}
    M -- All correct --> N[Select reminder offsets\npill chip toggles]
    M -- Deadline wrong --> O[Tap deadline chip\ndate/time picker]
    O --> N
    M -- Name wrong --> P[Tap name field\ninline edit]
    P --> N
    N --> Q[Tap Save]
    Q --> R[Sheet dismisses\nTask card appears in list\nviolet ring highlight]
    R --> S[Trust banner\n'Saved · Reminders: Wed 9am, Thu 9am'\nfades after 3s]
    S --> T([Task list · ready for next capture])
```

**Key UX decisions in this flow:**
- Mic permission prompt fires on first FAB tap, not on app open — reduces friction at launch
- Network error offers text entry as immediate fallback — never a dead end
- Save button disabled until name + deadline both populated — prevents invalid saves silently
- Trust banner is specific (actual times, not just "saved") — eliminates post-save doubt

## UJ-2: Set Up a Recurring Task

```mermaid
flowchart TD
    A([Task list]) --> B[Tap Voice FAB]
    B --> C[Speak recurring utterance\n'Prep for standup every Monday 8:30am']
    C --> D[LLM parses:\nname + deadline + recurrence]
    D --> E[Confirmation Sheet\nRecurrence field visible\n'Every Monday']
    E --> F{Recurrence correct?}
    F -- Yes --> G[Select offsets · Save]
    F -- No / missing --> H[Tap Repeat toggle\nPicker: daily / weekly / monthly]
    H --> I[Select day/s + confirm]
    I --> G
    G --> J[Task saved\nrecurrence badge on card\n'↻ Mon']
    J --> K([Task list])

    subgraph On Completion
    L[Mark task complete] --> M[Task moves to archive]
    M --> N[Next instance auto-created\nsame name · next Monday · same offsets]
    N --> O[New card appears in list\nno user action required]
    end
```

**Key UX decisions:**
- Recurrence field shown on Confirmation Screen only when parsed — not always visible (reduces noise for one-off tasks)
- Recurrence badge `↻ Mon` on task card communicates the pattern without opening detail
- Auto-continuation is fully silent — no prompt, no modal, card just appears

## UJ-3: Act on a Notification

```mermaid
flowchart TD
    A([Phone locked / another app]) --> B[Push notification fires\n'Call the dentist — due in 1 hour']
    B --> C{User action}
    C -- Tap notification --> D{App state}
    C -- Dismiss --> E([User deals with it later])
    D -- App closed --> F[App launches\nroutes to task detail]
    D -- App open elsewhere --> G[Navigates to task detail]
    F --> H[Task detail view]
    G --> H
    H --> I{User action}
    I -- Mark complete --> J[Archived · reminders cancelled]
    J --> K{Recurring?}
    K -- Yes --> L[Next instance auto-created]
    K -- No --> M([Done])
    L --> M
    I -- Edit task --> N[Edit mode · any field editable]
    N --> O[Save · reminders rescheduled]
    O --> H
    I -- Delete --> P[Confirm dialog]
    P -- Confirm --> Q[Deleted · reminders cancelled]
    P -- Cancel --> H
```

## Journey Patterns

**Navigation patterns:**
- Modal sheet for all creation/edit flows — never full-screen navigation for task entry
- Back arrow only on task detail; all other navigation is sheet dismiss (swipe down or Cancel)
- Notification tap always deep-links to task detail, bypassing the task list

**Decision patterns:**
- Destructive actions (delete, end series) require a confirmation dialog — all others execute immediately
- Save is always the primary CTA, full-width, at the bottom of the sheet
- Inline edit on Confirmation Screen (tap field to edit) — no separate "edit mode" on that screen

**Feedback patterns:**
- State transitions always acknowledged: listening → processing → result; save → banner; complete → archive
- Errors presented inline with a clear recovery action — never a blocking alert
- Success states are brief and specific — trust banner fades, task card settles to normal

## Flow Optimization Principles

1. **No dead ends.** Every error state offers at least one recovery action (retry, type instead, cancel).
2. **Minimal confirmation dialogs.** Only destructive/irreversible actions prompt; everything else executes immediately.
3. **Auto-advance where intent is clear.** Silence detection ends recording automatically; recurring next-instance creates without user action.
4. **Deep-link everything from notifications.** Tapping a notification lands on the task, never on the task list.

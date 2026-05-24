# 8. Open Questions

1. **LLM provider:** Which model handles voice transcript parsing — Claude, GPT-4o, Gemini? Affects latency, cost, and API key management. Decision deferred to architecture phase.
2. **Scheduler:** APScheduler (in-process) vs. Celery + Redis (out-of-process). APScheduler is simpler for single-user; Celery is more reliable for long-running deployments. Deferred to architecture phase.
3. **iOS push notifications:** Browser push on iOS requires PWA installation via Safari (not just visiting the URL). Does this constraint change the deployment/onboarding approach?
4. **Overdue task reminders:** If a Deadline passes with a task still incomplete, should the app send any additional notification, or stay silent? Not defined in the brief.
5. **Completed task retention:** How long are archived tasks kept? Indefinitely? 90 days? Brief does not specify.
6. **Deployment target:** Specific platform (Railway, Fly.io, Vercel + backend, VPS)? Affects architecture but should be confirmed before architecture phase begins.

---

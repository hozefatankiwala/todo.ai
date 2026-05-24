# Addendum — Simple Todo App PRD

*Depth that informs downstream work but doesn't belong in the PRD's requirements narrative.*

---

## Tech Stack Options (for Architecture Phase)

### LLM Provider candidates
- **Claude (Anthropic):** Strong natural-language date parsing, good at structured output. API cost per parse is low for single-user volume.
- **GPT-4o (OpenAI):** Fast, reliable JSON mode, strong temporal reasoning. Popular default.
- **Gemini (Google):** Competitive on cost; less widely used in this pattern.
- **Recommendation trigger:** Pick whichever the builder has an API key for and has used before — for single-user volume, cost difference is negligible.

### Scheduler candidates
- **APScheduler (in-process):** Simplest setup, runs inside the FastAPI process. Risk: scheduler state lost on process restart (mitigated by persisting jobs to a DB). Good for single-user, low-volume deployments.
- **Celery + Redis:** Out-of-process, highly reliable, standard for production notification systems. More infrastructure to manage. Probably overkill for v1 but a clean upgrade path.
- **Architecture recommendation:** Start with APScheduler + SQLite persistence. Document the Celery upgrade path.

### Deployment platform candidates
- **Railway:** Simple, supports Python/FastAPI natively, free tier available. Good DX.
- **Fly.io:** More control, good for persistent workers. Slightly more setup.
- **Render:** Similar to Railway, good free tier.
- **VPS (DigitalOcean, Linode):** Full control, requires more ops. Not recommended unless builder wants the infra experience.

---

## iOS Push Notification Constraints

Browser push (Web Push API) on iOS requires:
1. Safari 16.4+ on iOS 16.4+ (2023).
2. The site must be installed as a PWA (Add to Home Screen) — push does not work from the in-browser Safari tab.
3. User must grant notification permission after PWA installation.

**Implication:** Onboarding flow should prompt the builder to install the PWA before the first Reminder-enabled Task is created. A banner or modal explaining this is warranted.

---

## Access Control Options (for Deployment Planning)

Since the app has no authentication and will be publicly deployed:

- **HTTP Basic Auth (nginx/caddy level):** Simplest; one username/password in the server config. Works on all browsers including mobile.
- **Obscure URL + no robots.txt:** Security through obscurity. Acceptable for a personal tool with no sensitive data beyond task names.
- **IP allowlist:** Lock to the builder's home IP + phone carrier IP. Fragile (IP changes), not recommended.
- **Recommendation:** HTTP Basic Auth at the reverse proxy level. Adds ~2 seconds to first load; zero app code changes needed.

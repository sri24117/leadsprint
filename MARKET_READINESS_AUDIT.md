# LeadSprint Market-Readiness Audit

Audit date: 2026-08-05

## Executive verdict

LeadSprint is a convincing **demo-grade vertical slice**, not yet a production SaaS. The repository has a useful domain model, tenant-aware queries in several core routes, session authentication, provider adapters, Docker assets, and 30 passing unit tests. However, the production build fails, several primary screens display invented data, critical webhook and API paths can be forged or bypassed, and provider callbacks are not idempotent.

**Current readiness: 3/10.** Do not expose this build to customer PII, real ad leads, paid telephony, or autonomous WhatsApp sending.

The Pareto move is to make one narrow journey completely real before expanding features:

`Meta lead -> persisted lead -> consent/DND gate -> queued call -> verified provider callback -> outcome -> WhatsApp follow-up -> site visit -> human handoff`

Everything outside that journey should be clearly labelled demo/coming soon or removed from the pilot navigation.

## Verified evidence

| Check | Result | Meaning |
|---|---:|---|
| `npm test` | PASS, 30/30 | Crypto, scoring, and in-memory rate-limit unit tests pass. |
| `npm run build` | FAIL | `Prisma.DbNull` is not available in the generated Prisma type used by `api/cron/retention`; the product cannot produce a release build. |
| `npm audit --omit=dev` | FAIL, 2 high groups | The pinned Next.js 14.2.35 dependency and its PostCSS tree have current advisories. Upgrade and regression-test before launch. |
| Browser validation | BLOCKED | The referenced private ChatGPT/browser tab was not available to this session. No rendered UI claim is made. |

## Launch blockers (P0)

1. **Production build is broken.** `src/app/api/cron/retention/route.ts` uses `Prisma.DbNull` in a way that fails type-checking.
2. **Meta lead intake is publicly triggerable and not a real Meta Lead Ads flow.** The POST route verifies no Meta signature, accepts arbitrary JSON, uses a hard-coded fallback phone number, does not fetch the lead by `leadgen_id`, does not persist it, and immediately starts a potentially paid call. The GET challenge also accepts a committed fallback token (`leadsprint_token`).
3. **Authentication is structurally bypassable on some API routes.** Middleware checks only whether the session cookie exists, not whether it is valid. Routes such as `api/whatsapp/send`, `api/call-summary`, and `api/leads/[id]` do not call `requireCurrentUser`, so any non-empty forged cookie can reach them. The lead update route also updates by global ID without workspace scoping.
4. **A provider credential is embedded in client code.** `src/app/settings/page.tsx` initializes the Bolna API-key field with a key-like value. Treat it as compromised, revoke it, remove it from history/distributed ZIPs, and never render provider secrets to the browser.
5. **Webhook trust is fail-open.** Bolna and Vapi accept callbacks when their secret is absent. That must be impossible in production. The Vapi lookup can fall back to any agent whose default engine is Vapi, which risks cross-workspace attribution.
6. **Callbacks are not idempotent.** Bolna and Vapi always create a new `CallLog`; retries can duplicate calls, outcomes, metering, and downstream actions. `externalCallId` is indexed but not unique. Stripe also stores no processed event ID and performs no timestamp-tolerance check.
7. **The UI misrepresents product state.** Dashboard KPIs/activity, settings, billing, team, inbox, properties, site visits, and WhatsApp conversations are hard-coded or alert-only. Several actions show success without checking `response.ok`; customers can be told a call/message/settings update succeeded when it failed.
8. **Production errors silently become demo success.** Dashboard, appointments, follow-ups, and call-summary paths catch database errors and return fabricated objects, sometimes with 2xx/201 responses. Production must fail honestly and observably; demo fallback should be an explicit environment and visually unmistakable.
9. **No durable work orchestration.** Calls and messages execute inside request handlers. There is no queue, retry policy, dead-letter handling, concurrency cap, per-workspace spend limit, cancellation, or provider timeout discipline.
10. **Compliance controls are insufficient for automated calling.** A disclaimer field exists, but there is no auditable consent evidence, suppression/DND list, quiet-hour enforcement, opt-out propagation, recording access policy, legal-basis tracking, or region-specific policy engine.

## Frontend audit

### What is good

- Clear domain navigation and a consistent visual vocabulary.
- Useful starting primitives for cards, status, forms, dark mode, and operational pages.
- The lead page has the beginnings of API-backed CRUD and scoring.

### What must change

- Replace every invented metric and activity with typed API data; show loading, empty, error, stale, demo, and disconnected-provider states.
- Collapse the pilot navigation to Dashboard, Leads, Calls, Inbox/Handoff, and Settings. Hide unfinished modules instead of presenting mock products as live.
- Make actions transactional in the UI: disable during submission, validate `response.ok`, show a provider/request ID, and offer retry/reconciliation states.
- Replace `alert()` interactions with accessible dialogs/toasts and persistent status.
- Build a mobile navigation. At <=900px the sidebar merely shrinks; fixed two-column content and the 400px copilot can still overflow small screens.
- Add accessibility basics: semantic labels, keyboard/focus handling, reduced-motion support, contrast checks, error association, and icon labels.
- Move secrets out of settings forms. Workspace settings may store provider connection metadata, but secret entry must be write-only and encrypted server-side.
- Adopt a restrained, Apple-like system: one primary action per view, generous spacing, clear hierarchy, progressive disclosure, real-time status language, and fewer decorative gradients/emoji.

## Backend audit

### What is good

- Prisma models cover workspaces, users, agents, leads, calls, appointments, follow-ups, subscriptions, and audit events.
- Many authenticated routes correctly scope reads through `workspaceId`.
- Password/session primitives use salts, HMAC signing, HTTP-only cookies, and constant-time comparisons in several places.
- Voice engines and WhatsApp have adapter boundaries that can be hardened rather than rewritten.

### What must change

- Make route authentication explicit in every private route; middleware may optimize redirects but cannot be the authorization boundary.
- Enforce roles (`owner/admin/member`) for settings, billing, secrets, invites, exports, and destructive actions.
- Use an explicit `DEMO_MODE=true` gate unavailable in production. Never infer demo mode from a missing DB or a caught exception.
- Introduce a durable job system (Postgres-backed queue initially; Redis only when scale requires it) with idempotency keys and an outbox.
- Add unique provider-event/call IDs, webhook-event storage, replay protection, signature verification, payload schemas, maximum body sizes, and audit traces.
- Encrypt per-workspace provider credentials with envelope encryption/KMS. Do not use one global provider identity for every tenant long-term.
- Add database transactions around state transitions and downstream-event publication.
- Replace the process-local limiter before multiple instances; trust proxy headers only from the known reverse proxy.
- Add structured logs, request/correlation IDs, error monitoring, provider latency/success metrics, queue depth, and alerting.
- Add integration, authorization, webhook replay, and end-to-end tests. The current tests cover only pure utilities.

## Real coordination and connections

The database should be the source of truth; providers are delivery channels. Use this event-driven sequence:

1. **Capture:** Meta sends a signed notification containing `leadgen_id`.
2. **Hydrate:** A worker fetches lead details from Meta Graph API using a workspace connection.
3. **Normalize/dedupe:** Normalize E.164 phone, campaign, language, source IDs; enforce a unique external lead key.
4. **Policy gate:** Check consent evidence, suppression/DND, quiet hours, workspace status, subscription, and spend/minute limits.
5. **Orchestrate:** Persist a `CallJob` and publish it through an outbox in the same transaction.
6. **Execute:** A worker calls one provider with an idempotency key and records provider IDs.
7. **Reconcile:** A verified, idempotent callback updates the existing call—not a new duplicate record.
8. **Decide:** Extract structured qualification fields with confidence and route uncertain/legal questions to a human.
9. **Act:** Send an approved WhatsApp template, book Google/Outlook calendar, and update the CRM only after durable state changes.
10. **Measure:** Meter minutes/messages, attribute funnel outcomes, reconcile invoices, and expose the same real state to the UI.

Start with **one** choice in each category: Meta Lead Ads, Bolna *or* Vapi, Meta WhatsApp Cloud API, Google Calendar, and one CRM webhook/export. Adding WATI, Interakt, Twilio, Exotel, and multiple CRMs before this path is reliable will multiply failure modes.

## Three-phase market-readiness plan

### Phase 1 — Trustworthy pilot (1–2 weeks)

Goal: 3–5 design partners can run one real lead-to-call workflow safely with human supervision.

- Fix the build and upgrade Next/PostCSS to supported patched versions.
- Revoke the exposed Bolna-like key and implement server-only secret storage.
- Enforce auth/tenant scope/RBAC on every private route; add CSRF protection for state-changing browser requests.
- Replace the Meta endpoint with signed notification verification, Graph lead hydration, persistence, dedupe, and policy gating.
- Choose one voice provider; make secrets mandatory, callbacks idempotent, and failures explicit.
- Connect the real WhatsApp Cloud sender and approved templates; remove the parallel simulated WATI route.
- Make Dashboard, Leads, Calls, and Handoff read from the database; hide mock modules.
- Add queue/retry/dead-letter behavior, timeouts, concurrency limits, and a per-workspace kill switch.
- Add Sentry/structured logs, automated DB backups, restore test, and deployment health/readiness gates.
- Pilot release gate: 100 synthetic leads with zero duplicates, zero cross-tenant access, >95% job terminal-state reconciliation, and a successful restore drill.

### Phase 2 — Closed beta operations (2–4 weeks)

Goal: 10–25 paying workspaces can onboard and operate without developer intervention.

- Self-serve connection/onboarding wizard with connection tests and write-only encrypted secrets.
- Real team invites, roles, assignments, human takeover queue, SLAs, notifications, and audit trail.
- Google Calendar booking and one CRM connector/webhook with reconciliation.
- Consent ledger, DND/opt-out, quiet hours, retention/deletion/export, recording permissions, and regional policies reviewed by counsel.
- Stripe subscription lifecycle, usage metering, entitlements, payment-failure handling, webhook event ledger, and invoice reconciliation.
- Responsive/mobile UI, WCAG-focused pass, truthful empty/error/degraded states, and product analytics.
- Contract tests against provider sandbox payloads plus end-to-end tests for the golden path and failure recovery.
- Beta release gate: 99.5% API availability, no lost accepted leads, <60-second median capture-to-dial, and audited tenant isolation.

### Phase 3 — General availability (4–8 weeks)

Goal: reliable, supportable multi-tenant SaaS with predictable unit economics.

- Horizontally scalable workers and distributed rate limits; capacity/load tests and backpressure.
- SLOs, dashboards, on-call runbooks, incident process, provider failover policy, and customer status communication.
- Disaster-recovery targets and regular restore/failover drills.
- Security review, dependency automation, secret rotation, least-privilege infrastructure, penetration testing, and SOC 2 readiness if required by target buyers.
- Cost attribution per lead/call/message, budgets, anomaly detection, margin dashboards, and automatic spend caps.
- Polished onboarding, sample-to-live transition, in-product diagnostics, support tooling, and lifecycle messaging.
- GA release gate: agreed SLOs met for 30 days, no unresolved P0/P1 security findings, support and incident ownership staffed, and positive contribution margin at target usage.

## First 10 implementation tickets

1. Fix retention `DbNull` typing and make CI require test + typecheck + build.
2. Upgrade Next/PostCSS and rerun unit/build/security checks.
3. Revoke/remove the exposed provider key; add a secret scanning CI job.
4. Add a shared `withUser`/`withRole` route guard and fix every unguarded private endpoint.
5. Remove all production catch-to-demo behavior; add explicit `DEMO_MODE` invariants.
6. Implement the real Meta signed-notification -> Graph hydration -> persisted lead flow.
7. Add job/outbox, idempotency keys, unique provider IDs, retries, and dead-letter visibility.
8. Harden the selected voice webhook and reconcile it into the outbound call record.
9. Bind the four pilot screens to real data and remove fake success/UI claims.
10. Implement consent/DND/quiet hours plus an operational workspace kill switch.

## Product decision

Position the first paid version as **“AI speed-to-lead and qualification for Indian real-estate teams, with human supervision”**, not as a broad autonomous CRM. The wedge is response speed and booked site visits. Prove that outcome with one dependable workflow, then earn the right to add analytics, knowledge, properties, multi-provider routing, and broader automation.

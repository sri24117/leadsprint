# LeadSprint - Real Estate AI Caller

Market-ready MVP for a real estate AI lead caller.

> **Current maturity:** production-shaped prototype. Several screens and provider
> paths are still demo/partial, and the repository must pass the gates in the
> [market-readiness audit](MARKET_READINESS_AUDIT.md) before real customer data or
> paid calling traffic is enabled.

Positioning:

> LeadSprint calls every new real estate lead within 10 seconds, qualifies budget/location/timeline in Telugu/Hindi/English, books site visits, and sends WhatsApp summaries to the sales team.

## Product and Engineering Playbook

The authoritative pilot blueprint is in [`docs/00_INDEX.md`](docs/00_INDEX.md).
It covers product strategy, architecture, database/API design, UI/UX, backend and
frontend implementation, deployment, QA/security, go-to-market, decisions, and
operational runbooks.

The pilot is intentionally narrowed to one golden path:

```text
Meta lead -> policy gate -> queued Bolna call -> verified result
-> qualification -> sales handoff -> WhatsApp -> site visit
```

Target pilot navigation: Today, Leads, Calls, Handoff, and Connections. Unfinished
modules should be hidden instead of presenting simulated data as real operations.

## What This Build Includes

- Premium dashboard UI for a real estate sales team.
- Lead pipeline with hot leads, qualification status, budget, location, timeline, and next action.
- Selected lead detail panel with intent score and WhatsApp summary action.
- Call transcript/timeline UI with call duration.
- Agent setup panel for qualification focus.
- Hybrid voice engine selector: mock, Vapi, Bolna, or auto routing.
- APIs for dashboard, leads, appointments, follow-ups, and call summaries.
- Call-start API plus Twilio inbound, Bolna, and Vapi webhook routes.
- Prisma/Postgres data model for agents, calls, leads, appointments, and follow-ups.
- Demo-safe sample data fallback when the DB or providers are not configured.
- Production migration, seed script, readiness checks, Docker setup, and launch checklist.

## Local Dev

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run dev
```

Open:

```text
http://localhost:3000
```

The UI works in demo mode even before Postgres is running.

## Full Local Stack

```bash
docker compose up -d postgres
npm run prisma:migrate
npm run dev
```

## Core API

```text
GET  /api/dashboard
GET  /api/leads
POST /api/leads
PATCH /api/leads/:id
POST /api/appointments
POST /api/follow-ups
POST /api/call-summary
POST /api/calls/start
POST /api/webhooks/twilio/voice
POST /api/webhooks/bolna
POST /api/webhooks/vapi
GET  /api/health
GET  /api/readiness
POST /api/cron/retention
```

## Testing

```bash
npm test          # run once (30 tests: auth crypto, webhook signatures, scoring, rate limiter)
npm run test:watch
```

CI (`.github/workflows/ci.yml`) runs typecheck + tests + build on every push/PR.

## Data Retention

`Workspace.retentionDays` (default 180) drives automatic redaction of call transcripts, recording URLs, and caller numbers on `CallLog` rows older than that window — records aren't deleted outright, just stripped of PII, so call-volume analytics stay intact.

- **Docker/VPS deploy**: add a real crontab entry — `0 3 * * * cd /path/to/app && npm run retention:run`
- **Serverless deploy (Vercel etc.)**: use `POST /api/cron/retention` with header `X-Cron-Secret: <CRON_SECRET>`. See `.github/workflows/retention-cron.yml` for a GitHub Actions-based scheduler if your host has no native cron.

## Hybrid Voice Strategy

Use all three paths instead of betting the company on one provider:

- `mock`: local demos, sales calls, UI testing, and fallback when provider keys are missing.
- `vapi`: fastest premium pilot path for the first 1-5 customers.
- `bolna`: self-hosted/control path once call volume is high enough to justify infra work.

Recommended route:

1. Sell with mock dashboard demos this week.
2. Run the first paid pilot with Vapi because setup is fastest.
3. Add Bolna for high-volume India customers who need lower variable cost or infra control.
4. Keep both engines behind `/api/calls/start` so the product experience stays the same.

## First Customer Demo

1. Open the dashboard.
2. Show the empty/new lead workflow.
3. Add a lead named "Pradeep Sharma" with budget and location.
4. Select the lead and show intent score + next action.
5. Choose Mock, Vapi, Bolna, or Auto in Agent setup.
6. Click Call now to queue a lead call.
7. Click WhatsApp summary.
8. Explain that in production this action sends a real WhatsApp message after the call.
9. Show the transcript panel as the sales review screen.

Demo pitch:

> You already pay Meta and Google for leads. The problem is speed-to-lead. LeadSprint calls every lead instantly in Telugu/Hindi/English, qualifies budget and location, books site visits, and sends your sales team a WhatsApp summary.

## Production Wiring

For full production setup, use [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) and [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md).

### Required Accounts

- Twilio or Exotel/Plivo for telephony.
- Vapi for managed calls and/or Bolna self-hosted for controlled high-volume calls.
- Deepgram or OpenAI realtime transcription.
- OpenAI/OpenRouter for the LLM.
- Cartesia/ElevenLabs/Deepgram for TTS.
- WhatsApp Business API provider.

### Security Before Public Launch

- [x] Twilio signature verification — implemented (`src/lib/auth-crypto.ts::validateTwilioSignature`), enforced once `TWILIO_AUTH_TOKEN` is set.
- [x] Bolna webhook verification — shared secret via `BOLNA_WEBHOOK_SECRET` + `X-Webhook-Secret` header.
- [x] Authentication and tenant isolation — session auth + `workspaceId` scoping on every query.
- [x] Rate limiting — per-IP/per-email on login, general limiter on all public/unauthenticated routes, plus nginx `limit_req` at the edge.
- [x] Call recording consent copy — `Workspace.consentDisclaimer`, injected into the agent prompt when `recordingConsentRequired` is true.
- [x] DPDP-style data retention — `scripts/retention-cleanup.mjs` (cron) or `POST /api/cron/retention` (serverless), redacts transcripts/recordings/caller numbers past `retentionDays`.
- [ ] Confirm final Vapi and Bolna webhook payloads against live provider docs/accounts once you have real credentials — the current shapes are best-guesses documented in the webhook route comments.
- [ ] Put Postgres behind private network only — done for Docker (`127.0.0.1`-only binding); if you deploy Postgres elsewhere (managed/Supabase), confirm it's not publicly reachable there too.
- [ ] Enable HTTPS on nginx — config is ready in `nginx/nginx.conf`, commented out pending your domain + certbot run.

## Pricing Recommendation

India real estate pilot:

- Setup: Rs 25,000 to Rs 75,000
- Monthly: Rs 15,000 to Rs 50,000
- Usage: included minutes plus Rs 5 to Rs 12/min overage

Pilot offer:

> 7-day pilot on 50-100 leads. We measure contacted leads, qualified leads, site visits booked, and sales handoffs.

## Next Engineering Steps

1. Add real provider credentials and place an end-to-end Vapi pilot call.
2. Add auth and organization tenancy.
3. Add WhatsApp Cloud API integration.
4. Add Bolna webhook signature verification once the exact provider header is known.
5. Add deployment pipeline and demo video.

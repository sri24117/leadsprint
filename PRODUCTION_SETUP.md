# LeadSprint Production Setup

This setup is production-shaped. The app runs without provider keys in `mock` mode, then becomes real calling once you add Vapi or Bolna/telephony credentials.

## 1. Local Production Check

```bash
npm install
npm run prod:check
```

Expected:

- Prisma client generates successfully.
- Next.js production build passes.
- `/api/health` and `/api/readiness` compile.

## 2. Environment

```bash
copy .env.production.example .env
```

Minimum local production values:

```env
DATABASE_URL="postgresql://voiceai:voiceai@localhost:5432/voiceai?schema=public"
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_VOICE_ENGINE=mock
AUTH_SECRET=replace-with-a-long-random-secret
```

For a managed Vapi pilot:

```env
DEFAULT_VOICE_ENGINE=vapi
VAPI_API_KEY=...
VAPI_ASSISTANT_ID=...
VAPI_PHONE_NUMBER_ID=...
VAPI_WEBHOOK_SECRET=...
```

For low-cost Bolna Cloud:

```env
DEFAULT_VOICE_ENGINE=bolna
BOLNA_TELEPHONY_BASE_URL=https://api.bolna.ai
BOLNA_OUTBOUND_AGENT_ID=...
BOLNA_API_KEY=...
BOLNA_FROM_PHONE_NUMBER=...
```

For billing:

```env
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID=...
STRIPE_WEBHOOK_SECRET=...
```

For external monitoring:

```env
SENTRY_DSN=...
# or LOGTAIL_TOKEN / BETTERSTACK_SOURCE_TOKEN
```

For Bolna self-hosted:

```env
DEFAULT_VOICE_ENGINE=bolna
BOLNA_API_BASE_URL=http://bolna-app:5001
BOLNA_TELEPHONY_BASE_URL=http://your-bolna-telephony-service
BOLNA_OUTBOUND_AGENT_ID=...
```

## 3. Database

Run Postgres:

```bash
docker compose up -d postgres
```

Apply migrations:

```bash
npm run prisma:deploy
```

Optional demo data:

```bash
npm run seed
```

Seeded local login:

```text
Email: admin@leadsprint.local
Password: LeadSprint@123
```

With Docker setup profile:

```bash
docker compose --profile setup up migrate
```

## 4. Run App

Development:

```bash
npm run dev
```

Production runtime:

```bash
npm run build
npm run start
```

Docker:

```bash
docker compose build
docker compose up -d postgres
docker compose --profile setup up migrate
docker compose up -d app nginx
```

## 5. Readiness Tests

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/readiness
```

`/api/readiness` returns `503` if required keys for the selected engine are missing. That is intentional. Keep `DEFAULT_VOICE_ENGINE=mock` until you are ready to test live provider calls.

Dashboard APIs require login. Use the browser login page or a cookie session.

## 6. Provider Webhooks

Set these URLs in your providers:

```text
Vapi webhook:  https://your-domain.com/api/webhooks/vapi
Bolna webhook: https://your-domain.com/api/webhooks/bolna
Twilio voice:  https://your-domain.com/api/webhooks/twilio/voice
Stripe webhook: https://your-domain.com/api/webhooks/stripe
Health:        https://your-domain.com/api/health
Readiness:     https://your-domain.com/api/readiness
```

## 7. First Live Test

1. Keep `DEFAULT_VOICE_ENGINE=mock`.
2. Deploy and confirm `/api/health` is `ok`.
3. Add database seed data or create one lead in the dashboard.
4. Switch to `DEFAULT_VOICE_ENGINE=bolna`.
5. Add Bolna Cloud or self-hosted Bolna keys.
6. Restart app.
7. Add a public HTTPS URL in `Settings -> Production setup`.
8. Add a verified calling number.
9. Set the generated Bolna webhook URL in Bolna `Agent Studio -> Analytics`.
10. Confirm `/api/readiness` has no required blockers.
11. Click `Call now` for one verified test lead.
12. Check the call row stores `engine`, `externalCallId`, `status`, and webhook transcript/summary.

## 8. Production Foundations Included

- Signed HTTP-only client login.
- Workspace/customer isolation for dashboard, leads, agents, follow-ups, and appointments.
- Workspace production setup for public URL, verified number, webhook URL, and consent disclaimer.
- Stripe Checkout subscription endpoint and verified Stripe webhook endpoint.
- Local audit/event logging for auth, billing, and call actions.
- Client-side error capture endpoint.
- Consent disclaimer injected into live outbound call prompts.

## 9. External Steps Still Required Before Real Customers

- Deploy to HTTPS and update `NEXT_PUBLIC_APP_URL`.
- Add a verified Bolna/Twilio/Plivo/Exotel phone number.
- Add Stripe live keys and webhook secret.
- Add Sentry or Better Stack for external alerting.
- Do not expose Postgres publicly.
- Add backups for Postgres.
- Review consent copy with local legal counsel for India/US calling and recording rules.

# AGENTS.md — LeadSprint AI

## Product identity

LeadSprint contacts new real-estate leads quickly, qualifies budget, location,
property type, timeline, and buying intent in Telugu, Hindi, or English, then
hands hot leads to a salesperson with a structured summary and next action.

Primary customer: Indian residential developers and broker teams receiving at
least 300 digital leads per month.

Primary outcome: a new lead becomes a qualified human sales opportunity and a
booked site visit. Do not expand LeadSprint into a generic CRM before this path
is reliable.

## Current state versus target state

Current repository:

- Next.js 14 App Router, React, TypeScript, Prisma, and PostgreSQL.
- Session authentication and partial workspace-scoped APIs.
- Mock, Vapi, and Bolna voice adapters.
- Partially implemented Meta, WhatsApp, Stripe, and telephony integrations.
- Many frontend screens still use sample or hard-coded data.
- Production build currently has a known retention-route type failure.
- No separate durable worker process exists yet.

Target pilot architecture:

- One Next.js application plus one Node worker sharing PostgreSQL.
- PostgreSQL-backed durable jobs; no Redis until measured load requires it.
- Bolna as the single MVP voice provider.
- Meta WhatsApp Cloud API as the single messaging provider.
- Meta Lead Ads and Google Calendar as the first external connections.
- Five core product surfaces: Today, Leads, Calls, Handoff, Connections.

Never describe a target component as already implemented. Read
`docs/00_INDEX.md` and the current phase document before making changes.

## Non-negotiable engineering rules

- Every private API validates the session inside the route or a shared route wrapper.
- User-initiated customer-data access derives workspace identity only from the verified session.
- Return 404 for tenant-scoped records that are not visible to the current workspace.
- Persist local intent before contacting an external provider.
- External side effects use at-least-once processing plus idempotency and reconciliation.
- Business-state changes and job creation occur in one database transaction.
- Provider credentials are write-only, encrypted at rest, versioned for rotation, and never logged.
- Production never infers demo mode from missing configuration or caught exceptions.
- Webhooks fail closed in production and store/deduplicate provider events.
- Do not blindly retry an ambiguous paid provider operation; reconcile first.
- Every accepted job reaches a documented terminal state.
- Preserve user changes and use additive, reversible migrations.

## Task completion

For relevant code changes:

1. Add or update tests.
2. Run `npm test`.
3. Run type checking with `npx tsc --noEmit` until a dedicated script exists.
4. Run `npm run build`.
5. Run the relevant security/dependency check.
6. Summarize changed files, verified behaviour, and remaining risks.

Never claim rendered UI validation unless it was actually tested in a browser.

## Build order

1. Secure foundation and truthful demo separation.
2. Durable provider-event and job infrastructure.
3. Real Meta lead ingestion.
4. Reliable Bolna calling and callback reconciliation.
5. Qualification, handoff, WhatsApp, and site-visit workflow.
6. Five real-data product screens.
7. Monitoring, proof tests, runbooks, and paid pilot onboarding.


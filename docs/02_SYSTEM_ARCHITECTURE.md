# LeadSprint AI — System Architecture

## Goal

Support the first 3–10 paying workspaces with a system that is tenant-aware,
auditable, recoverable, and simple enough for a small team to operate.

## Deployment shape

```text
Next.js app
  - product UI
  - authenticated APIs
  - provider webhooks
  - health/readiness

Node worker
  - claims PostgreSQL jobs
  - calls providers
  - retries safe operations
  - reconciles uncertain operations

PostgreSQL
  - business source of truth
  - provider events
  - automation jobs
  - audit and usage records
```

Do not split into microservices before a measured scaling or ownership problem
exists. Do not add Redis before PostgreSQL queue latency is proven insufficient.

## Golden workflow

```text
Meta notification
  → verify raw signature
  → store/dedupe ProviderEvent
  → queue hydrate_lead in same transaction
  → return 200

hydrate_lead
  → fetch Meta lead
  → normalize/dedupe
  → policy gate
  → create Lead + initiate_call job transactionally

initiate_call
  → create CallLog first
  → enforce concurrency/spend/kill switch
  → call Bolna with stable request identity
  → persist accepted or uncertain state

Bolna callback
  → authenticate and dedupe
  → update existing CallLog
  → extract qualification
  → score and queue handoff

handoff
  → create assignment and SLA
  → send approved WhatsApp template
  → book site visit through shared appointment service
```

## Correctness model

The system provides at-least-once job execution, not a fictional exactly-once
guarantee. Idempotency keys, unique provider identifiers, transactions, leases,
and reconciliation make repeated processing safe.

Ambiguous paid provider calls are reconciled before retrying.

## Module boundaries

```text
src/app/api/       HTTP auth, validation, response shaping
src/lib/services/  Domain transitions and transactions
src/lib/providers/ Provider-specific clients and payload adapters
src/lib/policies/  Consent, DND, quiet hours, limits, entitlements
worker/jobs/       Job orchestration, retry, and reconciliation
prisma/            Schema and migrations
```

## Security boundaries

- User APIs derive workspace context from a validated server session.
- Webhooks authenticate provider identity before parsing/processing.
- System jobs carry an explicit workspace ID created by trusted server code.
- Credentials are encrypted with AES-256-GCM using random nonces and key versions.
- Raw payloads, transcripts, recordings, and phone numbers have retention policies.


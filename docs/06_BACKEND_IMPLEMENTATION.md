# LeadSprint AI — Backend Implementation

## Principle

The backend is the product spine. UI and providers can change; tenant-safe lead,
policy, calling, handoff, appointment, audit, and usage transitions remain stable.

## Implementation phases

### 1. Secure current foundation

- Fix retention build failure and patch vulnerable dependencies.
- Revoke/remove exposed credentials.
- Create an explicit `DEMO_MODE`; production errors never return sample success.
- Add a shared authenticated route wrapper and scope every private operation.
- Add request IDs, structured errors, CI, and tenant-isolation tests.

### 2. Durable infrastructure

- Add production entities and additive migrations.
- Implement versioned credential encryption.
- Implement atomic PostgreSQL job claiming with leases and `SKIP LOCKED`.
- Add retry/backoff, dead state, heartbeat/reconciliation, and audit transitions.

### 3. Real lead ingestion

- Verify Meta raw-body signature.
- Store/dedupe event and queue hydration transactionally.
- Fetch lead details, normalize with a phone library, and upsert source identity.
- Enforce consent, suppression, quiet hours, entitlement, and kill switch.

### 4. Reliable calling

- Create CallLog before Bolna request.
- Use a stable external request identity and bounded timeouts.
- Distinguish failed from uncertain; reconcile ambiguous operations.
- Authenticate/dedupe callback and update the existing call.

### 5. Qualification and action

- Extract structured fields and retain confidence/provenance.
- Apply deterministic, explainable scoring.
- Create handoff/assignment/SLA.
- Send approved WhatsApp templates and create site visits through shared services.

## Worker rules

- Claim jobs atomically with a lease owner and expiry.
- Keep handlers idempotent and bounded.
- Do not hold DB transactions open during provider network calls.
- Log every state transition with request/job/workspace/provider IDs.
- Retry only classified transient failures.
- Reconcile uncertain side effects before retrying.

## Minimum tests

- Authentication and role enforcement
- Cross-workspace read/write/call prevention
- Demo/production separation
- Webhook signature and replay
- Concurrent job claim and worker death recovery
- Ambiguous provider timeout reconciliation
- Suppression and quiet-hour policy
- Full Meta-to-handoff integration path


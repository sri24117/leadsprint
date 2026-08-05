# LeadSprint AI — Database Design

## Existing domain

Preserve and migrate the existing `Workspace`, `AppUser`, `VoiceAgent`, `Lead`,
`CallLog`, `Appointment`, `FollowUp`, `Subscription`, and `AuditEvent` models.

## Production additions

- `IntegrationConnection`: provider, status, encrypted credentials, key version,
  last success/error, and kill-switch state.
- `ExternalLead`: raw source identity, normalized fields, payload-retention time,
  and linked Lead.
- `ConsentRecord`: source, purpose, evidence, captured/expired/revoked timestamps.
- `SuppressionEntry`: normalized phone, reason, source, and active state.
- `AutomationJob`: type, payload, state, idempotency key, lease, attempts, run time,
  failure, external operation identity, and terminal timestamps.
- `ProviderEvent`: provider identity, external event identity, payload hash/status,
  received/processed timestamps, and retention time.
- `LeadAssignment`: salesperson, SLA deadline, status, accepted/resolved timestamps.
- `UsageEvent`: provider, usage type, quantity, unit, estimated/actual cost.

## Essential constraints

- Unique workspace/provider/external lead identity
- Unique provider/external event identity where the provider guarantees uniqueness
- Unique provider/external call identity
- Unique automation idempotency key
- Unique active ownership rule where required
- Indexes for workspace + status + time operational queries

Use a payload hash or documented composite identity when a provider does not
supply a globally stable event ID.

## Transactions

Keep these atomic:

- Provider event + downstream job
- External lead + Lead + call job
- Call result + Lead qualification + handoff job
- Assignment + notification job
- Appointment + calendar/confirmation job

## Migration policy

- Use Prisma migrations only.
- Back up production before migrations.
- Prefer expand/backfill/contract migrations.
- Never combine destructive schema changes with a major framework upgrade.

## Retention

Define and enforce separate windows for raw provider payloads, transcripts,
recordings, audit logs, consent evidence, and usage records. Minimize stored PII;
do not retain complete raw payloads indefinitely.


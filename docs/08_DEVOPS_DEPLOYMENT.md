# LeadSprint AI — DevOps and Deployment

## Environments

Local uses Docker/PostgreSQL with explicit demo credentials. Staging uses test
provider accounts and separate data. Production uses managed PostgreSQL with
backups, real credentials, monitoring, and no demo fallback.

## Services

- `app`: Next.js UI, APIs, and webhooks
- `worker`: Node job and reconciliation process
- `postgres`: managed in production
- `nginx` or platform gateway: TLS, trusted proxy, and request limits

## CI gates

- Install from lockfile
- Unit/integration tests
- `npx tsc --noEmit`
- Production build
- Migration validation
- Secret scan
- High/critical dependency review with documented exceptions

Upgrade to the minimum compatible patched dependency version; do not mix a
framework major migration with security/tenancy repair.

## Production startup gates

Refuse startup or readiness when database, auth secret, credential-encryption
key, required webhook authentication, or selected provider configuration is
missing. Production must never start in demo mode accidentally.

## Observability

Logs contain request/job/workspace/provider IDs, state transition, latency, and
result—but no phone, transcript, credential, or raw PII by default.

Alert on job failures, queue age, lead-to-call latency, worker inactivity,
webhook 5xx, provider failure, and database/storage health.

## Deployment and migration

- Back up before production migration.
- Use additive migrations and deploy compatible code before constraint cleanup.
- Keep previous deployment available.
- Smoke-test login, Meta event, call job, callback, handoff, kill switch, and audit.
- Verify restore into a separate database before the first paid pilot.


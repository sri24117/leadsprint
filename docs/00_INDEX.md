# LeadSprint AI — Documentation Pack

LeadSprint solves one expensive problem:

> Every new property lead contacted quickly, qualified clearly, and handed to
> sales before buyer intent goes cold.

## Documents

1. [Product strategy and PRD](01_PRODUCT_STRATEGY_PRD.md)
2. [System architecture](02_SYSTEM_ARCHITECTURE.md)
3. [Database design](03_DATABASE_DESIGN.md)
4. [API specification](04_API_SPECIFICATION.md)
5. [UI/UX design](05_UI_UX_DESIGN.md)
6. [Backend implementation](06_BACKEND_IMPLEMENTATION.md)
7. [Frontend implementation](07_FRONTEND_IMPLEMENTATION.md)
8. [DevOps and deployment](08_DEVOPS_DEPLOYMENT.md)
9. [QA and security](09_QA_SECURITY_AUDIT.md)
10. [Launch and go-to-market](10_LAUNCH_GO_TO_MARKET.md)
11. [Architecture decisions](DECISIONS.md)

The repository audit remains available at
[`../MARKET_READINESS_AUDIT.md`](../MARKET_READINESS_AUDIT.md).

## Pilot build order

1. Repair build, auth, tenancy, dependencies, credentials, and demo separation.
2. Add provider events, durable jobs, encryption, suppression, and consent.
3. Build Meta notification → hydration → persisted lead.
4. Build queued Bolna call → verified callback → reconciliation.
5. Build qualification → handoff → WhatsApp → site visit.
6. Replace mock navigation with five truthful real-data screens.
7. Prove recovery, isolation, deduplication, monitoring, and backup restoration.

## Production gates

- Runtime PostgreSQL and successful migrations
- Validated sessions and tenant boundaries
- Signed or strongly authenticated webhooks
- Durable, idempotent external actions
- Explicit demo mode
- Encrypted provider credentials
- Consent, suppression, quiet hours, and kill switches
- Audit logs, backups, monitoring, and operational runbooks


# LeadSprint AI — Architecture Decisions

## ADR-001: One voice provider

Use Bolna for the MVP. Revisit another provider after measured reliability and
at least 500 real calls justify the additional webhook, retry, and test surface.

## ADR-002: PostgreSQL job queue

Use `AutomationJob` with atomic claims, leases, backoff, dead state, and
reconciliation. Revisit Redis only after measured throughput/latency pressure.

## ADR-003: Direct Meta WhatsApp Cloud API

Remove WATI/Interakt/simulated production paths. Use approved templates and
process delivery/opt-out callbacks directly.

## ADR-004: Modular monolith plus worker

Keep one codebase and database. Split a service only when load or ownership proves
an independent boundary.

## ADR-005: Deterministic scoring

Use explainable rules for final score. Extraction may evolve, but retain source,
confidence, corrections, and deterministic policy.

## ADR-006: Manual onboarding

Manually onboard the first 10 workspaces. Revisit self-service after five
customers complete a successful month and the workflow is repeatable.

## ADR-007: At-least-once plus idempotency

Do not promise exactly-once external effects. Persist intent, use provider
idempotency when available, dedupe callbacks, and reconcile ambiguous operations.

## ADR-008: Hide unfinished modules

The pilot contains five real-data screens. A truthful absence is better than a
polished mock that implies a customer action occurred.


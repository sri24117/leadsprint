# Runbook — Provider Down

1. Confirm the outage through connection tests, error rate, latency, and provider status.
2. Enable the provider/workspace kill switch to stop new work while preserving queued intent.
3. Classify in-flight operations as accepted, failed, or uncertain and reconcile them.
4. Communicate impact, affected period, and manual fallback to pilot customers.
5. Resume with a small canary batch after recovery; watch callbacks and error rate.
6. Drain queued work within consent, quiet-hour, concurrency, and spend policies.
7. Record timeline, impact, resolution, and prevention actions.


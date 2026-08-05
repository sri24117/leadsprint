# Runbook — Dead Job

A dead job exhausted safe automatic attempts. Do not simply reset it.

1. Inspect job, workspace, type, attempts, failure classification, provider IDs,
   audit trail, and related business records.
2. Decide whether the external side effect definitely failed, definitely
   succeeded, or is uncertain.
3. For uncertainty, reconcile with the provider before any retry.
4. Fix the root cause and either retry with the same idempotency identity, mark
   completed after reconciliation, or route the lead to manual review.
5. Notify the pilot customer when the lead outcome or SLA was affected.
6. Create an engineering issue when the same cause repeats.


# Runbook — Database Restore

Before the first paid pilot, adapt these steps to the selected managed database
and rehearse them against staging.

1. Freeze new provider work with kill switches and stop workers.
2. Record the incident time and chosen recovery point.
3. Restore backup/PITR into a separate database; never overwrite first.
4. Run migrations only when the restored schema requires the deployed version.
5. Verify table counts, recent leads, jobs, calls, assignments, audit continuity,
   unique constraints, and sampled tenant boundaries.
6. Point staging at the restored database and run the golden-path smoke test.
7. Promote through the managed provider's safe process and restart app before worker.
8. Reconcile in-flight provider operations before releasing queued jobs.
9. Document recovery time, data-loss window, integrity checks, and follow-up actions.


# LeadSprint AI — QA and Security Audit

## Launch blockers

Do not onboard real customer data while any condition is true:

- Production build fails or high-risk dependency finding is unresolved.
- A private route trusts cookie presence without validating the session.
- A tenant-scoped operation can access another workspace.
- A production webhook fails open or accepts an unverified payload.
- A provider credential is present in source/browser/logs.
- Production errors can return fabricated demo success.
- A duplicated event can create a duplicated call/message/appointment.
- There is no suppression/quiet-hour/kill-switch policy.
- No backup restoration or operational recovery path has been tested.

## Proof tests

1. Send 100 unique Meta leads three times concurrently; create 100 leads and
   100 call intents, with no duplicate provider action.
2. Kill/restart workers during every handler type; every job becomes a documented
   terminal state and none is lost.
3. Exercise every tenant-scoped route using another workspace's IDs; return no data.
4. Delay and replay Bolna callbacks; update one call record correctly.
5. Suppress a number and verify no call or WhatsApp job executes.
6. Submit during quiet hours and verify a timezone-correct reschedule.
7. Enable a provider kill switch and verify no new jobs execute for it.
8. Restore production backup to a separate database and compare integrity checks.
9. Run the golden path in desktop and mobile browser viewports.

## Security checklist

- Password/session crypto reviewed; cookie flags and CSRF/origin controls tested
- Roles enforced for connections, secrets, billing, exports, and destructive actions
- Raw-body signature checks use constant-time comparison
- Body size/rate limits applied at gateway and application where appropriate
- Encryption nonces/tags/key versions stored correctly; rotation rehearsed
- PII/logging/retention/deletion policies implemented
- Recordings and transcript access audited
- No unsafe HTML rendering or frontend token exposure


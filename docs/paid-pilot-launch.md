# Paid pilot launch gate (US real-estate)

LeadSprint is the product base. BolnaAI's useful product lesson for this pilot
is to expose provider state and make uncertain outbound submissions a hard stop.
The two repositories have separate stacks and data models; there is no safe
drop-in merge. This pilot deliberately keeps the single Retell and Cal.com
workflow defined in [pilot-scope.md](pilot-scope.md).

## What the customer gets

- Signed lead intake or a CSV import, with recorded consent and suppression.
- Idempotent qualification calling, recipient-local calling hours, attempt
  limits, and a kill switch.
- A live operator console for leads, contacts, call outcomes, appointments,
  reports, and configuration. The console shows only records backed by the API;
  unavailable transcripts and recordings are stated as unavailable.
- Manual onboarding and invoicing. A team invitation flow, an AI prompt editor,
  simulated live-call controls, self-serve billing, and a CRM sync are **not**
  included in this pilot. Assign one named console operator; do not share a
  Clerk login between team members.

## Release checks

1. Deploy the reviewed commit using [coolify-deploy.md](coolify-deploy.md).
   Keep production demo auth and seeding off; use one replica and a real database.
2. Run `pnpm pilot:preflight https://your-domain` from a separate machine.
   It must pass TLS and report `database: ok`, `auth: clerk`, and `mode: live`.
   The pilot needs Retell, Cal.com and signed intake; Twilio is optional.
   Confirm an operator can sign in and that another workspace's data is hidden.
3. Complete the provider and intake setup in
   [leadsprint-provider-setup.md](leadsprint-provider-setup.md). Verify the
   console's setup checklist and signed Retell and Cal.com callbacks.
4. Obtain written customer approval of their calling, AI disclosure, recording,
   consent, and jurisdiction requirements. Confirm the lead source records
   consent evidence and an operator can suppress a number.
5. With a controlled consenting test number, follow
   [pilot-acceptance.md](pilot-acceptance.md): signed intake, one real Retell
   call, qualified outcome, live Cal.com availability and booking, signed
   callbacks, and a human follow-up. Verify retries do not double-dial.
6. Simulate a lost provider response: the call must remain `uncertain`, all
   further dial paths must block, and the operator must check Retell's call log
   before changing the call's outcome. Never clear an uncertain status solely
   to make the Retry button available.
7. Test the kill switch, quiet-hours deferral, invalid consent, suppression,
   backup restore, and alert delivery. Monitor the first pilot daily.
8. Agree a written one-office pilot offer, the included usage and overage
   treatment, the manual invoice, and a support contact before charging.

**Go/no-go:** passing local tests and a demo is insufficient. Do not claim a
paid pilot is live until the production checks and the controlled real call
above have passed on the deployed commit.

If the public browser reports an untrusted certificate, stop at the HTTPS
configuration in Coolify/your DNS provider. Do not bypass the warning or run
the controlled call until the same domain passes `pnpm pilot:preflight` from
an external machine.

# LeadSprint AI — Frontend Implementation

## Goal

Build a truthful operational frontend where a salesperson can understand and
act on a qualified lead in under 30 seconds.

## Structure

```text
src/app/
  today/
  leads/
  calls/
  handoff/
  connections/
src/components/
  app-shell/
  leads/
  calls/
  handoff/
  connections/
  ui/
src/lib/
  api/
  errors/
  format/
  permissions/
```

## Data rules

- Use one typed API layer; page components do not hand-roll fetch semantics.
- Validate `response.ok` and normalize errors.
- Keep server state in a server-state library or route-level fetches, filters in
  URLs, and transient controls in local state.
- Never display fallback customer data after a production request failure.
- Show request/provider identity when useful for support.

## Build order

1. App shell and explicit demo/degraded banners
2. Today
3. Connections readiness
4. Leads list/detail/timeline
5. Calls list/detail
6. Handoff queue and actions

## Acceptance

- No hard-coded business KPI or customer record remains in pilot screens.
- All writes provide pending, confirmed, failed, and retry/reconcile feedback.
- Mobile widths do not overflow.
- User/provider text cannot inject HTML.
- Keyboard and focus behaviour works.
- Rendered desktop and mobile flows are browser-tested before completion claims.


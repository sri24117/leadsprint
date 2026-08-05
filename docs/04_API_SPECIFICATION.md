# LeadSprint AI — API Specification

## Principles

- JSON APIs with Zod validation and a consistent error shape.
- Private APIs validate the session inside the route wrapper.
- Writes use idempotency keys where clients or providers may retry.
- Every consequential write creates an audit event.
- No raw exception, provider secret, or decrypted credential appears in responses.

## Error shape

```json
{
  "error": {
    "code": "lead_not_found",
    "message": "Lead not found.",
    "requestId": "req_123"
  }
}
```

## Pilot APIs

```text
GET    /api/me
GET    /api/today
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PATCH  /api/leads/:id
POST   /api/leads/:id/call
GET    /api/calls
GET    /api/calls/:id
GET    /api/handoffs
POST   /api/handoffs/:id/accept
POST   /api/handoffs/:id/resolve
GET    /api/connections
POST   /api/connections/:provider/test
POST   /api/connections/:provider/disable
POST   /api/site-visits
GET    /api/audit-events
```

## Webhooks

```text
GET/POST /api/webhooks/meta
POST     /api/webhooks/bolna
POST     /api/webhooks/whatsapp
POST     /api/webhooks/stripe
```

Webhook handlers perform only authentication, bounded validation, event
deduplication, transactional job creation, and a fast acknowledgement. Long or
paid work belongs in the worker.

## Route authorization

- Invalid/missing session: 401.
- Valid user missing an explicit role permission: 403.
- Tenant-scoped record not visible to the workspace: 404.
- Webhook authentication failure: 401/403 without processing.

## Internal services

The worker calls domain services directly rather than exposing public internal
HTTP endpoints. AI/provider tools receive a trusted workspace context and use
the same lead, appointment, policy, and audit services as the dashboard.


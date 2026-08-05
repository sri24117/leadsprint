# Launch Checklist

## Technical

- [ ] `npm run prod:check` passes.
- [ ] `npm run prisma:deploy` applied on production DB.
- [ ] `/api/health` returns `status: ok`.
- [ ] `/api/readiness` returns `status: ready` for selected engine.
- [ ] Dashboard loads with real database data.
- [ ] One mock call can be queued.
- [ ] One live Vapi or Bolna call can be queued.
- [ ] Provider webhook writes transcript/summary back to `CallLog`.
- [ ] Nginx is serving HTTPS.
- [ ] Database is not publicly exposed.
- [ ] Daily database backup is configured.

## Voice Provider

- [ ] Vapi assistant or Bolna agent prompt matches one vertical.
- [ ] Voice language tested for Telugu, Hindi, and English.
- [ ] Call opening includes business identity.
- [ ] Call closing captures next action.
- [ ] Failure path falls back to human follow-up.
- [ ] Recording and transcript retention policy is agreed with customer.

## Sales Pilot

- [ ] One real estate customer selected.
- [ ] 50-100 leads imported or connected from Meta/Google/manual.
- [ ] Success metrics agreed: contacted rate, qualified leads, site visits booked.
- [ ] Pricing agreed before pilot starts.
- [ ] WhatsApp summary copy approved.
- [ ] Demo video recorded.

## India Compliance Basics

- [ ] Customer has permission to contact their leads.
- [ ] Caller identity is clear.
- [ ] Recording consent is handled where required.
- [ ] Opt-out path is documented.
- [ ] DPDP-style data retention and deletion process exists.

# LeadSprint AI — UI/UX Design

## Design goal

Create a calm sales-operations cockpit: premium, restrained, fast to scan,
truthful about system state, mobile-friendly, and low in cognitive load.

Use Apple-like restraint, Linear-like clarity, and Stripe-like operational copy.
Avoid decorative AI theatre, excessive gradients, emoji navigation, and fake
live indicators.

## Pilot navigation

1. Today
2. Leads
3. Calls
4. Handoff
5. Connections

Hide unfinished Properties, Knowledge, Copilot, generic Analytics, and other
mock modules during the pilot.

## Today

Show new leads, calls in progress, hot leads awaiting action, site visits,
failed jobs, and connection warnings. The primary action is **Review handoffs**.

## Lead detail

Show identity, source, qualification, explainable score, assignment, consent
state, and a chronological timeline of provider and human actions.

## Calls

Represent queued, initiating, in-progress, completed, failed, suppressed, and
uncertain/reconciling states. Put transcript and recording behind disclosure.

## Handoff

Each card shows why the lead is hot, minutes since qualification, SLA, owner,
and three primary actions: call, assign/accept, and book visit.

## Connections

Show connected/error/disconnected, last successful event, test, disconnect,
and kill switch. Secret values are write-only and never redisplayed.

## Required states

Every data surface has loading, empty, error, disconnected, stale/degraded, and
demo states. A success message appears only after a confirmed server result.

## Accessibility and mobile

- Keyboard and screen-reader usable controls
- Visible focus and reduced-motion support
- Text/icon labels in addition to colour
- Mobile supports Today, Handoff, Lead detail, and call action without overflow
- Desktop targets common 1366px sales laptops


export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function isPublicHttpsUrl(url: string) {
  return url.startsWith("https://") && !url.includes("localhost") && !url.includes("127.0.0.1");
}

export function getBolnaWebhookUrl() {
  return `${getPublicAppUrl().replace(/\/$/, "")}/api/webhooks/bolna`;
}

export function getProductionSetupStatus(workspace?: {
  verifiedCallingNumber?: string | null;
  recordingConsentRequired?: boolean;
  consentDisclaimer?: string | null;
}) {
  const publicAppUrl = getPublicAppUrl();
  const bolnaWebhookUrl = getBolnaWebhookUrl();
  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
  const hasMonitoring = Boolean(process.env.SENTRY_DSN || process.env.LOGTAIL_TOKEN || process.env.BETTERSTACK_SOURCE_TOKEN);
  const checks = [
    {
      name: "Public HTTPS URL",
      ok: isPublicHttpsUrl(publicAppUrl),
      message: isPublicHttpsUrl(publicAppUrl)
        ? "Public deployment URL is configured"
        : "Use a deployed HTTPS URL or ngrok/Cloudflare Tunnel before live webhooks"
    },
    {
      name: "Bolna webhook",
      ok: isPublicHttpsUrl(bolnaWebhookUrl),
      message: `Set Bolna Analytics webhook to ${bolnaWebhookUrl}`
    },
    {
      name: "Verified calling number",
      ok: Boolean(process.env.BOLNA_FROM_PHONE_NUMBER || workspace?.verifiedCallingNumber),
      message: "Add a verified Bolna/Twilio/Plivo caller number before outbound calling"
    },
    {
      name: "Billing",
      ok: hasStripe,
      message: hasStripe ? "Stripe subscription checkout is configured" : "Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID"
    },
    {
      name: "Monitoring",
      ok: hasMonitoring,
      message: hasMonitoring ? "External monitoring env is configured" : "Local audit logging is active; add Sentry/Better Stack before launch"
    },
    {
      name: "Consent disclaimer",
      ok: Boolean(workspace?.consentDisclaimer),
      message: "Voice call consent/disclaimer text is configured"
    }
  ];
  return {
    publicAppUrl,
    bolnaWebhookUrl,
    checks,
    readyForLiveCalls: checks.filter((check) => ["Public HTTPS URL", "Verified calling number", "Consent disclaimer"].includes(check.name)).every((check) => check.ok)
  };
}

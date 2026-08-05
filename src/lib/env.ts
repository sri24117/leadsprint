export type RuntimeCheck = {
  name: string;
  ok: boolean;
  required: boolean;
  message: string;
};

function present(name: string) {
  return Boolean(process.env[name]?.trim());
}

function bolnaCloudMode() {
  return (process.env.BOLNA_TELEPHONY_BASE_URL ?? "").includes("bolna.ai");
}

function publicHttpsAppUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return value.startsWith("https://") && !value.includes("localhost") && !value.includes("127.0.0.1");
}

export function getRuntimeChecks(): RuntimeCheck[] {
  const defaultEngine = process.env.DEFAULT_VOICE_ENGINE ?? "mock";
  const wantsVapi = defaultEngine === "vapi";
  const wantsBolna = defaultEngine === "bolna";

  return [
    {
      name: "DATABASE_URL",
      ok: present("DATABASE_URL"),
      required: process.env.NODE_ENV === "production",
      message: present("DATABASE_URL") ? "Postgres connection string configured" : "Missing Postgres connection string"
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      ok: present("NEXT_PUBLIC_APP_URL"),
      required: true,
      message: present("NEXT_PUBLIC_APP_URL") ? "Public app URL configured" : "Set the public app URL"
    },
    {
      name: "Vapi outbound",
      ok: present("VAPI_API_KEY") && present("VAPI_ASSISTANT_ID") && present("VAPI_PHONE_NUMBER_ID"),
      required: wantsVapi,
      message: "Requires VAPI_API_KEY, VAPI_ASSISTANT_ID, and VAPI_PHONE_NUMBER_ID"
    },
    {
      name: "Vapi webhook",
      ok: present("VAPI_WEBHOOK_SECRET"),
      required: wantsVapi,
      message: "Set VAPI_WEBHOOK_SECRET before exposing the webhook publicly"
    },
    {
      name: "Bolna outbound",
      ok: present("BOLNA_TELEPHONY_BASE_URL") && present("BOLNA_OUTBOUND_AGENT_ID"),
      required: wantsBolna,
      message: "Requires BOLNA_TELEPHONY_BASE_URL and BOLNA_OUTBOUND_AGENT_ID"
    },
    {
      name: "Bolna Cloud auth",
      ok: !bolnaCloudMode() || present("BOLNA_API_KEY"),
      required: wantsBolna && bolnaCloudMode(),
      message: "Bolna Cloud requires BOLNA_API_KEY; self-hosted Bolna can omit it"
    },
    {
      name: "Bolna from number",
      ok: present("BOLNA_FROM_PHONE_NUMBER"),
      required: false,
      message: "Recommended when your Bolna/telephony provider needs a caller number"
    },
    {
      name: "Public deployment URL",
      ok: publicHttpsAppUrl(),
      required: process.env.NODE_ENV === "production",
      message: "Required for Bolna webhooks, transcripts, and call recordings to reach LeadSprint"
    },
    {
      name: "Auth secret",
      ok: present("AUTH_SECRET"),
      required: process.env.NODE_ENV === "production",
      message: "Set AUTH_SECRET to sign client sessions"
    },
    {
      name: "Stripe billing",
      ok: present("STRIPE_SECRET_KEY") && present("STRIPE_PRICE_ID"),
      required: false,
      message: "Required for paid self-serve checkout"
    },
    {
      name: "Monitoring",
      ok: present("SENTRY_DSN") || present("LOGTAIL_TOKEN") || present("BETTERSTACK_SOURCE_TOKEN"),
      required: false,
      message: "Recommended before selling beyond pilots"
    },
    {
      name: "Twilio",
      ok: present("TWILIO_ACCOUNT_SID") && present("TWILIO_AUTH_TOKEN"),
      required: false,
      message: "Required only for Twilio inbound/outbound telephony"
    },
    {
      name: "WhatsApp",
      ok: present("WHATSAPP_ACCESS_TOKEN") && present("WHATSAPP_PHONE_NUMBER_ID"),
      required: false,
      message: "Required when WhatsApp sending is enabled"
    }
  ];
}

export function getRuntimeReadiness() {
  const checks = getRuntimeChecks();
  const blocking = checks.filter((check) => check.required && !check.ok);
  return {
    status: blocking.length === 0 ? "ready" : "blocked",
    defaultEngine: process.env.DEFAULT_VOICE_ENGINE ?? "mock",
    checks
  };
}

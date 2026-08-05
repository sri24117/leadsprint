import { prisma } from "@/lib/db";

type MonitorInput = {
  workspaceId?: string | null;
  level?: "info" | "warn" | "error";
  source: string;
  message: string;
  metadata?: unknown;
};

/**
 * Minimal Sentry delivery over their envelope HTTP API — no `@sentry/*`
 * SDK dependency. This is intentional: the full SDK auto-instruments
 * routing, breadcrumbs, and performance tracing, none of which this app
 * needs. All we need is "get errors into Sentry's UI so alerts fire",
 * and the envelope endpoint is a stable, documented public API for
 * exactly that.
 *
 * DSN shape: https://<publicKey>@<host>/<projectId>
 */
function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace(/^\//, "");
    if (!publicKey || !projectId) return null;
    return { host: url.host, publicKey, projectId };
  } catch {
    return null;
  }
}

async function sendToSentry(input: MonitorInput) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || input.level !== "error") return; // only ship errors — warn/info stay in the local audit log
  const parsed = parseSentryDsn(dsn);
  if (!parsed) return;

  const eventId = crypto.randomUUID().replace(/-/g, "");
  const timestamp = new Date().toISOString();
  const envelopeHeader = JSON.stringify({ event_id: eventId, sent_at: timestamp });
  const itemHeader = JSON.stringify({ type: "event" });
  const event = JSON.stringify({
    event_id: eventId,
    timestamp,
    level: "error",
    platform: "node",
    message: input.message,
    logger: input.source,
    tags: { workspaceId: input.workspaceId ?? "none", source: input.source },
    extra: input.metadata ?? {}
  });
  const envelope = `${envelopeHeader}\n${itemHeader}\n${event}\n`;

  const endpoint = `https://${parsed.host}/api/${parsed.projectId}/envelope/?sentry_key=${parsed.publicKey}&sentry_version=7`;
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: envelope
    });
  } catch (error) {
    // Never let monitoring delivery break the request path it's called from.
    console.error("[monitoring] failed to deliver event to Sentry", error);
  }
}

export async function captureEvent(input: MonitorInput) {
  console[input.level === "error" ? "error" : input.level === "warn" ? "warn" : "log"](
    `[${input.source}] ${input.message}`,
    input.metadata ?? ""
  );

  // Fire-and-forget — don't make the caller (an API route) wait on Sentry.
  void sendToSentry(input);

  if (!process.env.DATABASE_URL) return;
  try {
    await prisma.auditEvent.create({
      data: {
        workspaceId: input.workspaceId ?? undefined,
        level: input.level ?? "info",
        source: input.source,
        message: input.message,
        metadata: input.metadata as any
      }
    });
  } catch (error) {
    console.error("[monitoring] failed to persist audit event", error);
  }
}

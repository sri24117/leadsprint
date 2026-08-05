import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSharedSecret } from "@/lib/auth";

// Expected mock payload shape — confirm this against Bolna's actual
// webhook schema before going live. Common fields across voice-AI
// platforms (Bolna, Vapi, Retell) are: an external agent id, caller
// number, transcript array, detected language, duration, and a terminal
// call status, so this is a reasonable first guess.
interface BolnaWebhookPayload {
  agent_id: string;
  id?: string;
  execution_id?: string;
  call_id?: string;
  caller_number?: string;
  detected_language?: string;
  transcript?: Array<{ role: string; text: string; timestamp_ms?: number }> | string;
  conversation_time?: number;
  duration_seconds?: number;
  recording_url?: string;
  telephony_data?: {
    duration?: number;
    from_number?: string;
    to_number?: string;
    recording_url?: string;
  };
  summary?: string;
  outcome?: string;
  status?: "completed" | "missed" | "failed" | "in_progress" | "in-progress" | "error";
}

export async function POST(req: NextRequest) {
  // Bolna (self-hosted) doesn't sign webhook payloads as of this writing —
  // confirm against their current docs before launch. Until/unless they
  // add real signing, enforce a shared secret passed as a custom header
  // that only you and your Bolna config know, configured on the Bolna
  // side as an extra header on the analytics/callback webhook.
  const configuredSecret = process.env.BOLNA_WEBHOOK_SECRET;
  if (configuredSecret) {
    const incoming = req.headers.get("x-webhook-secret");
    if (!validateSharedSecret(configuredSecret, incoming)) {
      console.warn("[bolna webhook] rejected request: invalid or missing X-Webhook-Secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // No secret configured yet — allow through (mock/demo mode) but log
    // loudly so this doesn't silently stay open once real calls start.
    console.warn("[bolna webhook] BOLNA_WEBHOOK_SECRET not set — webhook is unauthenticated");
  }

  const payload = (await req.json()) as BolnaWebhookPayload;

  if (!payload.agent_id) {
    return NextResponse.json({ error: "agent_id required" }, { status: 400 });
  }

  const agent = await prisma.voiceAgent.findUnique({
    where: { bolnaAgentId: payload.agent_id }
  });
  if (!agent) {
    // Don't 500 on an unknown agent id — ack it so Bolna doesn't retry
    // forever, but log loudly since it usually means a stale/deleted
    // mapping.
    console.warn(`Webhook for unknown bolnaAgentId=${payload.agent_id}`);
    return NextResponse.json({ ok: true, warning: "unknown agent" });
  }

  const providerStatus = payload.status === "in-progress" ? "in_progress" : payload.status;
  const call = await prisma.callLog.create({
    data: {
      agentId: agent.id,
      callerNumber: payload.caller_number ?? payload.telephony_data?.to_number,
      detectedLanguage: payload.detected_language,
      transcript: payload.transcript as any,
      durationSec: payload.duration_seconds ?? payload.conversation_time ?? payload.telephony_data?.duration,
      engine: "bolna",
      externalCallId: payload.execution_id ?? payload.id ?? payload.call_id,
      recordingUrl: payload.recording_url ?? payload.telephony_data?.recording_url,
      summary: payload.summary,
      outcome: payload.outcome,
      status: providerStatus ?? "in_progress",
      endedAt: providerStatus && providerStatus !== "in_progress" ? new Date() : null
    }
  });

  return NextResponse.json({ ok: true, callId: call.id });
}

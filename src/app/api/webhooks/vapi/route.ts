import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface VapiWebhookPayload {
  message?: {
    type?: string;
    call?: {
      id?: string;
      assistantId?: string;
      customer?: { number?: string };
      startedAt?: string;
      endedAt?: string;
      status?: string;
    };
    transcript?: Array<{ role: string; text?: string; message?: string; time?: number }>;
    summary?: string;
    recordingUrl?: string;
    durationSeconds?: number;
    analysis?: { summary?: string; successEvaluation?: string };
  };
}

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
}

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (configuredSecret) {
    const incoming = req.headers.get("x-vapi-secret") ?? getBearerToken(req);
    if (incoming !== configuredSecret) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }
  }

  const payload = (await req.json()) as VapiWebhookPayload;
  const message = payload.message;
  const call = message?.call;
  const assistantId = call?.assistantId ?? process.env.VAPI_ASSISTANT_ID;
  if (!assistantId) {
    return NextResponse.json({ error: "assistantId required" }, { status: 400 });
  }

  const agent = await prisma.voiceAgent.findFirst({
    where: {
      OR: [{ vapiAssistantId: assistantId }, { defaultEngine: "vapi" }]
    }
  });
  if (!agent) {
    console.warn(`Webhook for unknown vapiAssistantId=${assistantId}`);
    return NextResponse.json({ ok: true, warning: "unknown agent" });
  }

  const transcript = message?.transcript?.map((turn) => ({
    role: turn.role,
    text: turn.text ?? turn.message ?? "",
    timestampMs: turn.time
  }));

  const status = call?.status === "ended" || message?.type === "end-of-call-report" ? "completed" : call?.status ?? "in_progress";
  const callLog = await prisma.callLog.create({
    data: {
      agentId: agent.id,
      callerNumber: call?.customer?.number,
      transcript: transcript as any,
      durationSec: message?.durationSeconds,
      engine: "vapi",
      externalCallId: call?.id,
      recordingUrl: message?.recordingUrl,
      summary: message?.summary ?? message?.analysis?.summary,
      outcome: message?.analysis?.successEvaluation,
      status,
      startedAt: call?.startedAt ? new Date(call.startedAt) : new Date(),
      endedAt: call?.endedAt ? new Date(call.endedAt) : status !== "in_progress" ? new Date() : null
    }
  });

  return NextResponse.json({ ok: true, callId: callLog.id });
}

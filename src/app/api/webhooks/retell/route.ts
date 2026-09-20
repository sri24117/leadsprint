import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateSharedSecret } from "@/lib/auth";
import { captureEvent } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

type RetellPayload = {
  event?: string;
  event_id?: string;
  call?: {
    call_id?: string; agent_id?: string; call_status?: string; from_number?: string; to_number?: string;
    start_timestamp?: number; end_timestamp?: number; transcript?: unknown; recording_url?: string;
    metadata?: Record<string, unknown>; call_analysis?: { call_summary?: string; call_successful?: boolean };
  };
};

function authorized(req: NextRequest) {
  const secret = process.env.RETELL_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const incoming = req.headers.get("x-retell-secret") ?? req.headers.get("authorization")?.replace(/^Bearer /, "");
  return validateSharedSecret(secret, incoming);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RETELL_WEBHOOK_SECRET && process.env.NODE_ENV === "production") return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const payload = (await req.json()) as RetellPayload;
  const call = payload.call;
  if (!call?.call_id) return NextResponse.json({ error: "call.call_id required" }, { status: 400 });
  const agent = await prisma.voiceAgent.findFirst({ where: { retellAgentId: call.agent_id ?? process.env.RETELL_AGENT_ID } });
  if (!agent) return NextResponse.json({ ok: true, warning: "unknown retell agent" }, { status: 202 });
  const eventType = payload.event ?? "call_update";
  const eventId = payload.event_id ?? call.call_id + ":" + eventType + ":" + (call.end_timestamp ?? call.start_timestamp ?? "unknown");
  try {
    await prisma.providerEvent.create({ data: { workspaceId: agent.workspaceId, provider: "retell", externalEventId: eventId, eventType, payload } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ ok: true, duplicate: true });
    throw error;
  }
  const metadata = call.metadata ?? {};
  const leadId = typeof metadata.leadId === "string" ? metadata.leadId : undefined;
  const status = call.call_status === "ended" ? "completed" : call.call_status === "error" ? "failed" : call.call_status ?? "in_progress";
  const startedAt = call.start_timestamp ? new Date(call.start_timestamp) : undefined;
  const endedAt = call.end_timestamp ? new Date(call.end_timestamp) : status === "completed" || status === "failed" ? new Date() : null;
  const summary = call.call_analysis?.call_summary;
  const data = { callerNumber: call.from_number ?? call.to_number, transcript: call.transcript as any, engine: "retell" as const, externalCallId: call.call_id, recordingUrl: call.recording_url, summary, outcome: call.call_analysis?.call_successful === true ? "successful" : call.call_analysis?.call_successful === false ? "unsuccessful" : undefined, status, ...(startedAt ? { startedAt } : {}), endedAt };
  const existing = await prisma.callLog.findFirst({ where: { externalCallId: call.call_id, agentId: agent.id } });
  const saved = existing ? await prisma.callLog.update({ where: { id: existing.id }, data }) : await prisma.callLog.create({ data: { ...data, agentId: agent.id, leadId } });
  await prisma.providerEvent.update({ where: { provider_externalEventId: { provider: "retell", externalEventId: eventId } }, data: { status: "processed", processedAt: new Date() } });
  await captureEvent({ workspaceId: agent.workspaceId, source: "retell", message: "Retell " + eventType + " processed", metadata: { callId: saved.id, externalCallId: call.call_id } });
  return NextResponse.json({ ok: true, callId: saved.id });
}

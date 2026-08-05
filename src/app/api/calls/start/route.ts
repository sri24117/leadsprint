import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sampleAgent, sampleLeads } from "@/lib/sample-data";
import { startCallSchema } from "@/lib/validation";
import { chooseEngine, startLeadCallWithFallback, type VoiceEngineName } from "@/lib/services/voice-engine";
import { buildAgentPrompt } from "@/lib/business-context";
import { requireCurrentUser } from "@/lib/auth";
import { captureEvent } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = startCallSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    const lead = sampleLeads.find((item) => item.id === parsed.data.leadId) ?? sampleLeads[0];
    const engine = chooseEngine({
      requested: parsed.data.engine as VoiceEngineName | undefined,
      defaultEngine: sampleAgent.defaultEngine as VoiceEngineName,
      preferredLanguage: lead.preferredLanguage
    });
    const result = await startLeadCallWithFallback(
      {
        leadId: lead.id,
        agentId: parsed.data.agentId ?? sampleAgent.id,
        leadName: lead.name,
        leadPhone: parsed.data.phone || lead.phone,
        preferredLanguage: lead.preferredLanguage,
        companyName: sampleAgent.companyName,
        businessPrompt: buildAgentPrompt(sampleAgent.businessPrompt, sampleAgent.businessContext),
        engine
      },
      { fallbackEngine: parsed.data.fallbackEngine as VoiceEngineName | undefined }
    );
    return NextResponse.json({
      call: {
        id: crypto.randomUUID(),
        leadId: lead.id,
        agentId: parsed.data.agentId ?? sampleAgent.id,
        engine: result.engine,
        externalCallId: result.externalCallId,
        status: result.status,
        startedAt: new Date().toISOString()
      },
      result,
      mode: "demo",
      warning: "DATABASE_URL is not configured"
    });
  }

  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lead = await prisma.lead.findFirst({
    where: { id: parsed.data.leadId, agent: { workspaceId: user.workspaceId } },
    include: { agent: { include: { workspace: true } } }
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const engine = chooseEngine({
    requested: parsed.data.engine as VoiceEngineName | undefined,
    defaultEngine: lead.agent.defaultEngine as VoiceEngineName,
    preferredLanguage: lead.preferredLanguage
  });

  const result = await startLeadCallWithFallback(
    {
      leadId: lead.id,
      agentId: lead.agentId,
      leadName: lead.name,
      leadPhone: lead.phone,
      preferredLanguage: lead.preferredLanguage,
      companyName: lead.agent.companyName,
      businessPrompt: [
        lead.agent.workspace.recordingConsentRequired ? `Start by saying: ${lead.agent.workspace.consentDisclaimer}` : "",
        buildAgentPrompt(lead.agent.businessPrompt, lead.agent.businessContext)
      ]
        .filter(Boolean)
        .join("\n\n"),
      engine
    },
    { fallbackEngine: parsed.data.fallbackEngine as VoiceEngineName | undefined }
  );

  const call = await prisma.callLog.create({
    data: {
      leadId: lead.id,
      agentId: lead.agentId,
      callerNumber: lead.phone,
      engine: result.engine,
      externalCallId: result.externalCallId,
      status: result.status,
      outcome: "AI call initiated",
      summary: result.providerMessage
    }
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "calling", nextAction: "AI call in progress" }
  });

  await captureEvent({
    workspaceId: user.workspaceId,
    source: "calls",
    message: "Outbound call initiated",
    metadata: { leadId: lead.id, engine: result.engine, externalCallId: result.externalCallId }
  });

  return NextResponse.json({ call, result });
}

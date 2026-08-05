import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAgentSchema } from "@/lib/validation";
import { getBolnaService } from "@/lib/services/bolna";
import { sampleAgent } from "@/lib/sample-data";
import { buildAgentPrompt } from "@/lib/business-context";
import { requireCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ agents: [sampleAgent], mode: "demo", warning: "DATABASE_URL is not configured" });
  }

  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agents = await prisma.voiceAgent.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { calls: true } } }
  });
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        agent: {
          id: crypto.randomUUID(),
          ...parsed.data,
          bolnaAgentId: parsed.data.defaultEngine === "bolna" ? `mock-bolna-${crypto.randomUUID()}` : null,
          vapiAssistantId: parsed.data.defaultEngine === "vapi" ? `mock-vapi-${crypto.randomUUID()}` : null,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        mode: "demo",
        warning: "DATABASE_URL is not configured"
      },
      { status: 201 }
    );
  }

  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Persist as draft first so a Bolna outage never loses the owner's
  //    config — this is the same "write local state before calling the
  //    flaky external API" pattern you used for booking writes in Ava.
  const agent = await prisma.voiceAgent.create({
    data: { ...parsed.data, workspaceId: user.workspaceId, status: "draft" }
  });

  if (agent.defaultEngine === "vapi") {
    return NextResponse.json(
      {
        agent,
        warning: "Vapi assistant sync is configured at runtime through VAPI_ASSISTANT_ID for this MVP"
      },
      { status: 201 }
    );
  }

  // 2. Sync to Bolna. If this fails, the agent still exists in `draft` and
  //    can be retried via PATCH — it just isn't live yet.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const bolna = getBolnaService();
    const { bolnaAgentId } = await bolna.createAgent({
      companyName: agent.companyName,
      businessPrompt: buildAgentPrompt(agent.businessPrompt, agent.businessContext),
      languages: agent.languages,
      voiceProfile: agent.voiceProfile,
      webhookUrl: `${appUrl}/api/webhooks/bolna`
    });

    const updated = await prisma.voiceAgent.update({
      where: { id: agent.id },
      data: { bolnaAgentId, status: "active", lastSyncedAt: new Date(), lastSyncError: null }
    });
    return NextResponse.json({ agent: updated }, { status: 201 });
  } catch (err) {
    const failed = await prisma.voiceAgent.update({
      where: { id: agent.id },
      data: { status: "failed", lastSyncError: (err as Error).message }
    });
    // 201, not 500 — the resource was created, it just isn't synced yet.
    // The client should show "saved, sync failed, retry" rather than
    // treating this as a hard error and discarding the form input.
    return NextResponse.json({ agent: failed, warning: "Bolna sync failed" }, { status: 201 });
  }
}

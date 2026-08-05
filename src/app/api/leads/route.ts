import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLeadSchema } from "@/lib/validation";
import { nextActionForScore, scoreLead } from "@/lib/scoring";
import { sampleAgent } from "@/lib/sample-data";
import { requireCurrentUser } from "@/lib/auth";

async function resolveAgent(workspaceId: string, agentId?: string) {
  if (agentId) {
    const agent = await prisma.voiceAgent.findFirst({ where: { id: agentId, workspaceId } });
    if (agent) return agent.id;
  }
  const agent = await prisma.voiceAgent.findFirst({ where: { workspaceId }, orderBy: { createdAt: "desc" } });
  if (agent) return agent.id;
  const created = await prisma.voiceAgent.create({
    data: {
      workspaceId,
      companyName: sampleAgent.companyName,
      businessPrompt: sampleAgent.businessPrompt,
      languages: sampleAgent.languages,
      voiceProfile: "multilingual",
      defaultEngine: "mock",
      status: "draft"
    }
  });
  return created.id;
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ leads: [], mode: "demo", warning: "DATABASE_URL is not configured" });
  }

  try {
    const { user, response } = await requireCurrentUser(req);
    if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const leads = await prisma.lead.findMany({
      where: { agent: { workspaceId: user.workspaceId } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ leads: [], mode: "demo", warning: (error as Error).message });
  }
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const intentScore = scoreLead(parsed.data);
  const nextAction = parsed.data.nextAction === "Call now" ? nextActionForScore(intentScore) : parsed.data.nextAction;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        lead: {
          id: crypto.randomUUID(),
          ...parsed.data,
          agentId: parsed.data.agentId ?? sampleAgent.id,
          intentScore,
          nextAction,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        mode: "demo",
        warning: "DATABASE_URL is not configured"
      },
      { status: 201 }
    );
  }

  try {
    const { user, response } = await requireCurrentUser(req);
    if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const agentId = await resolveAgent(user.workspaceId, parsed.data.agentId);
    const lead = await prisma.lead.create({
      data: {
        ...parsed.data,
        agentId,
        intentScore,
        nextAction
      }
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        lead: {
          id: crypto.randomUUID(),
          ...parsed.data,
          agentId: parsed.data.agentId ?? sampleAgent.id,
          intentScore,
          nextAction,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        mode: "demo",
        warning: (error as Error).message
      },
      { status: 201 }
    );
  }
}

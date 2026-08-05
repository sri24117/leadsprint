import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateAgentSchema } from "@/lib/validation";
import { getBolnaService } from "@/lib/services/bolna";
import { buildAgentPrompt } from "@/lib/business-context";
import { requireCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await prisma.voiceAgent.findFirst({
    where: { id: params.id, workspaceId: user.workspaceId },
    include: { calls: { orderBy: { startedAt: "desc" }, take: 20 } }
  });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = updateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.voiceAgent.findFirst({ where: { id: params.id, workspaceId: user.workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.voiceAgent.update({
    where: { id: params.id },
    data: parsed.data
  });

  // Re-sync config-relevant fields to Bolna if the agent is already live.
  // Status-only changes (e.g. pause) don't need a full config push.
  const configFields = ["companyName", "businessPrompt", "businessContext", "languages", "voiceProfile"] as const;
  const changedConfig = configFields.some((f) => f in parsed.data);

  if (changedConfig && existing.bolnaAgentId) {
    try {
      await getBolnaService().updateAgent(existing.bolnaAgentId, {
        ...parsed.data,
        businessPrompt: buildAgentPrompt(
          parsed.data.businessPrompt ?? existing.businessPrompt,
          parsed.data.businessContext ?? existing.businessContext
        )
      });
      await prisma.voiceAgent.update({
        where: { id: params.id },
        data: { lastSyncedAt: new Date(), lastSyncError: null, status: "active" }
      });
    } catch (err) {
      await prisma.voiceAgent.update({
        where: { id: params.id },
        data: { status: "failed", lastSyncError: (err as Error).message }
      });
      return NextResponse.json(
        { agent: updated, warning: "Saved locally, Bolna re-sync failed" },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ agent: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await prisma.voiceAgent.findFirst({ where: { id: params.id, workspaceId: user.workspaceId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.bolnaAgentId) {
    try {
      await getBolnaService().deleteAgent(existing.bolnaAgentId);
    } catch (err) {
      // Don't block local deletion on a flaky remote delete — log it and
      // let ops clean up the orphaned Bolna agent separately. Silently
      // succeeding locally while lying about remote state would be worse.
      console.error(`Bolna deleteAgent failed for ${existing.bolnaAgentId}:`, err);
    }
  }

  await prisma.voiceAgent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

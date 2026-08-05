import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth";
import { getBolnaWebhookUrl, getProductionSetupStatus } from "@/lib/production";
import { updateWorkspaceSchema } from "@/lib/validation";
import { captureEvent } from "@/lib/monitoring";

export async function GET(req: NextRequest) {
  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [workspace, subscription, recentEvents] = await Promise.all([
    prisma.workspace.findUnique({ where: { id: user.workspaceId } }),
    prisma.subscription.findFirst({ where: { workspaceId: user.workspaceId }, orderBy: { createdAt: "desc" } }),
    prisma.auditEvent.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { createdAt: "desc" }, take: 8 })
  ]);

  return NextResponse.json({
    workspace,
    subscription,
    setup: getProductionSetupStatus(workspace ?? undefined),
    bolnaWebhookUrl: workspace?.bolnaWebhookUrl ?? getBolnaWebhookUrl(),
    recentEvents
  });
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateWorkspaceSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const publicAppUrl = parsed.data.publicAppUrl?.replace(/\/$/, "");
  const workspace = await prisma.workspace.update({
    where: { id: user.workspaceId },
    data: {
      ...parsed.data,
      publicAppUrl,
      bolnaWebhookUrl: publicAppUrl ? `${publicAppUrl}/api/webhooks/bolna` : undefined,
      verifiedCallingNumber: parsed.data.verifiedCallingNumber || undefined
    }
  });
  await captureEvent({ workspaceId: user.workspaceId, source: "production", message: "Production setup updated" });
  return NextResponse.json({ workspace, setup: getProductionSetupStatus(workspace) });
}

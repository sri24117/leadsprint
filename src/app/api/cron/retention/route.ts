import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { validateSharedSecret } from "@/lib/auth";
import { captureEvent } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Same redaction logic as scripts/retention-cleanup.mjs, exposed over
 * HTTP for platforms where you can't run an arbitrary cron process
 * (Vercel, most serverless hosts). Protect with CRON_SECRET — set it as
 * a Vercel Cron header or a GitHub Actions scheduled `curl` secret.
 *
 * If you're on the Docker/VPS deploy (docker-compose.yml), prefer the
 * plain `node scripts/retention-cleanup.mjs` cron job instead — one less
 * public endpoint to secure.
 */
export async function POST(req: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET;
  const incoming = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (!validateSharedSecret(configuredSecret, incoming)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaces = await prisma.workspace.findMany({
    select: { id: true, name: true, retentionDays: true }
  });

  let totalRedacted = 0;
  const perWorkspace: Array<{ workspaceId: string; redacted: number }> = [];

  for (const workspace of workspaces) {
    const cutoff = new Date(Date.now() - workspace.retentionDays * 24 * 60 * 60 * 1000);
    const result = await prisma.callLog.updateMany({
      where: {
        agent: { workspaceId: workspace.id },
        startedAt: { lt: cutoff },
        OR: [{ recordingUrl: { not: null } }, { callerNumber: { not: null } }]
      },
      data: {
        transcript: Prisma.DbNull,
        recordingUrl: null,
        callerNumber: null,
        summary: "[redacted per data retention policy]"
      }
    });

    if (result.count > 0) {
      totalRedacted += result.count;
      perWorkspace.push({ workspaceId: workspace.id, redacted: result.count });
      await captureEvent({
        workspaceId: workspace.id,
        level: "info",
        source: "retention",
        message: `Redacted ${result.count} call log(s) past ${workspace.retentionDays}-day retention window`
      });
    }
  }

  return NextResponse.json({ ok: true, totalRedacted, workspacesProcessed: workspaces.length, perWorkspace });
}

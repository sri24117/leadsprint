// Data retention enforcement — run on a schedule (cron / Vercel Cron /
// GitHub Actions scheduled workflow). See PRODUCTION_SETUP.md.
//
// Policy: redact rather than hard-delete. Per workspace.retentionDays,
// any CallLog older than that window has its transcript, recording URL,
// and caller number wiped (kept as an audit stub with dates/status
// intact), instead of deleting the row outright. This satisfies a
// DPDP-style "don't retain personal data beyond stated purpose" duty
// while keeping call-volume/outcome analytics intact.
//
// Usage: node scripts/retention-cleanup.mjs
// Cron:  0 3 * * *   (daily at 03:00)

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspaces = await prisma.workspace.findMany({
    select: { id: true, name: true, retentionDays: true }
  });

  let totalRedacted = 0;

  for (const workspace of workspaces) {
    const cutoff = new Date(Date.now() - workspace.retentionDays * 24 * 60 * 60 * 1000);

    const result = await prisma.callLog.updateMany({
      where: {
        agent: { workspaceId: workspace.id },
        startedAt: { lt: cutoff },
        // Only touch rows that still have something to redact, so reruns
        // are cheap no-ops instead of rewriting already-clean rows.
        OR: [{ transcript: { not: null } }, { recordingUrl: { not: null } }, { callerNumber: { not: null } }]
      },
      data: {
        transcript: null,
        recordingUrl: null,
        callerNumber: null,
        summary: "[redacted per data retention policy]"
      }
    });

    if (result.count > 0) {
      console.log(
        `[retention] ${workspace.name} (${workspace.id}): redacted ${result.count} call log(s) older than ${workspace.retentionDays}d`
      );
      totalRedacted += result.count;

      await prisma.auditEvent.create({
        data: {
          workspaceId: workspace.id,
          level: "info",
          source: "retention",
          message: `Redacted ${result.count} call log(s) past ${workspace.retentionDays}-day retention window`,
          metadata: { cutoff: cutoff.toISOString() }
        }
      });
    }
  }

  console.log(`[retention] done. ${totalRedacted} call log(s) redacted across ${workspaces.length} workspace(s).`);
}

main()
  .catch((error) => {
    console.error("[retention] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

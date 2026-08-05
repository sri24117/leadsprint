import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sampleDashboard } from "@/lib/sample-data";
import { requireCurrentUser } from "@/lib/auth";
import { getProductionSetupStatus } from "@/lib/production";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ...sampleDashboard(), mode: "demo", warning: "DATABASE_URL is not configured" });
  }

  try {
    const { user, response } = await requireCurrentUser(req);
    if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agent =
      (await prisma.voiceAgent.findFirst({
        where: { workspaceId: user.workspaceId },
        orderBy: { createdAt: "desc" }
      })) ??
      (await prisma.voiceAgent.create({
        data: {
          workspaceId: user.workspaceId,
          companyName: "Hyderabad Prime Realty",
          businessPrompt:
            "You are the AI caller for Hyderabad Prime Realty. Qualify budget, location, timeline, and book site visits.",
          languages: ["te", "hi", "en"],
          voiceProfile: "multilingual",
          defaultEngine: "mock",
          status: "draft"
        }
      }));

    const [leads, calls, appointments, followUps, hotLeads, siteVisits, callsToday, needsFollowUp] =
      await Promise.all([
        prisma.lead.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 25 }),
        prisma.callLog.findMany({ where: { agentId: agent.id }, orderBy: { startedAt: "desc" }, take: 20 }),
        prisma.appointment.findMany({
          where: { agentId: agent.id },
          orderBy: { scheduledFor: "asc" },
          take: 20
        }),
        prisma.followUp.findMany({ where: { agentId: agent.id }, orderBy: { createdAt: "desc" }, take: 20 }),
        prisma.lead.count({ where: { agentId: agent.id, intentScore: { gte: 75 } } }),
        prisma.appointment.count({ where: { agentId: agent.id, status: "booked" } }),
        prisma.callLog.count({
          where: {
            agentId: agent.id,
            startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        prisma.lead.count({ where: { agentId: agent.id, status: "follow_up" } })
      ]);

    const [workspace, subscription] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: user.workspaceId } }),
      prisma.subscription.findFirst({ where: { workspaceId: user.workspaceId }, orderBy: { createdAt: "desc" } })
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      workspace,
      subscription,
      production: getProductionSetupStatus(workspace ?? undefined),
      agent,
      metrics: {
        hotLeads,
        siteVisits,
        callsToday,
        needsFollowUp,
        contactedRate: callsToday ? Math.min(100, Math.round((calls.length / Math.max(leads.length, 1)) * 100)) : 0,
        qualifiedRate: leads.length
          ? Math.round(
              (leads.filter((lead: { status: string }) => lead.status === "qualified" || lead.status === "site_visit")
                .length /
                leads.length) *
                100
            )
          : 0
      },
      leads,
      calls,
      appointments,
      followUps
    });
  } catch (error) {
    const demo = sampleDashboard();
    return NextResponse.json({ ...demo, mode: "demo", warning: (error as Error).message });
  }
}

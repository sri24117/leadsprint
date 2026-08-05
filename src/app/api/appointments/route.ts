import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAppointmentSchema } from "@/lib/validation";
import { sampleAgent } from "@/lib/sample-data";
import { requireCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createAppointmentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        appointment: { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() },
        mode: "demo",
        warning: "DATABASE_URL is not configured"
      },
      { status: 201 }
    );
  }

  try {
    const { user, response } = await requireCurrentUser(req);
    if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const lead = await prisma.lead.findFirst({
      where: { id: parsed.data.leadId, agent: { workspaceId: user.workspaceId } }
    });
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const appointment = await prisma.appointment.create({
      data: {
        ...parsed.data,
        agentId: parsed.data.agentId ?? lead?.agentId ?? sampleAgent.id
      }
    });
    await prisma.lead.update({
      where: { id: parsed.data.leadId },
      data: { status: "site_visit", nextAction: "Site visit booked" }
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        appointment: { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() },
        mode: "demo",
        warning: (error as Error).message
      },
      { status: 201 }
    );
  }
}

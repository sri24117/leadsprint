import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createFollowUpSchema } from "@/lib/validation";
import { sampleAgent } from "@/lib/sample-data";
import { requireCurrentUser } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/services/whatsapp";
import { captureEvent } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = createFollowUpSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        followUp: { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() },
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

    // Actually deliver the message for whatsapp channel + sent/queued
    // status, instead of just recording an intent to send.
    let deliveryStatus = parsed.data.status;
    let deliveryError: string | undefined;
    if (parsed.data.channel === "whatsapp" && (parsed.data.status === "sent" || parsed.data.status === "queued")) {
      const result = await sendWhatsAppMessage({
        to: lead.phone,
        message: parsed.data.message,
        workspaceId: user.workspaceId
      });
      deliveryStatus = result.ok ? "sent" : "failed";
      if (!result.ok) {
        deliveryError = result.error;
        await captureEvent({
          workspaceId: user.workspaceId,
          level: "error",
          source: "whatsapp",
          message: "WhatsApp follow-up delivery failed",
          metadata: { leadId: lead.id, error: result.error }
        });
      }
    }

    const followUp = await prisma.followUp.create({
      data: {
        ...parsed.data,
        agentId: parsed.data.agentId ?? lead?.agentId ?? sampleAgent.id,
        status: deliveryStatus,
        sentAt: deliveryStatus === "sent" ? new Date() : undefined
      }
    });
    await prisma.lead.update({
      where: { id: parsed.data.leadId },
      data:
        deliveryStatus === "sent"
          ? { status: "follow_up", nextAction: "Follow-up sent" }
          : {}
    });
    return NextResponse.json({ followUp, deliveryError }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        followUp: { id: crypto.randomUUID(), ...parsed.data, createdAt: new Date().toISOString() },
        mode: "demo",
        warning: (error as Error).message
      },
      { status: 201 }
    );
  }
}

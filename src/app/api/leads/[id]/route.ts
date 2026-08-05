import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextActionForScore, scoreLead } from "@/lib/scoring";
import { updateLeadSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const json = await req.json();
  const parsed = updateLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, mode: "demo", warning: "DATABASE_URL is not configured" });
  }

  try {
    const intentScore = parsed.data.intentScore ?? scoreLead(parsed.data);
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        intentScore,
        nextAction: parsed.data.nextAction ?? nextActionForScore(intentScore)
      }
    });
    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ ok: false, warning: (error as Error).message }, { status: 202 });
  }
}

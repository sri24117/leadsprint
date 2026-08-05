import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { callSummarySchema } from "@/lib/validation";
import { sampleAgent } from "@/lib/sample-data";

function localSummary(transcript: Array<{ role: string; text: string }>) {
  const combined = transcript.map((turn) => turn.text).join(" ");
  const budget = combined.match(/(\d+)\s*(l|lakhs|cr|crore)/i)?.[0];
  const locations = ["Kondapur", "Gachibowli", "Miyapur", "Kompally", "Nallagandla"];
  const location = locations.find((item) => combined.toLowerCase().includes(item.toLowerCase()));
  return [
    budget ? `Budget: ${budget}` : "Budget: not captured",
    location ? `Location: ${location}` : "Location: not captured",
    "Next action: qualify and book site visit"
  ].join(". ");
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = callSummarySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const summary = parsed.data.summary ?? localSummary(parsed.data.transcript);
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        call: { id: crypto.randomUUID(), ...parsed.data, status: "completed", summary },
        summary,
        mode: "demo",
        warning: "DATABASE_URL is not configured"
      },
      { status: 201 }
    );
  }

  try {
    const call = await prisma.callLog.create({
      data: {
        agentId: parsed.data.agentId ?? sampleAgent.id,
        leadId: parsed.data.leadId,
        callerNumber: parsed.data.callerNumber,
        detectedLanguage: parsed.data.detectedLanguage,
        transcript: parsed.data.transcript,
        durationSec: parsed.data.durationSec,
        status: "completed",
        engine: parsed.data.engine,
        externalCallId: parsed.data.externalCallId,
        summary,
        outcome: parsed.data.outcome ?? "Qualified",
        recordingUrl: parsed.data.recordingUrl,
        endedAt: new Date()
      }
    });
    return NextResponse.json({ call, summary }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        call: { id: crypto.randomUUID(), ...parsed.data, status: "completed", summary },
        summary,
        mode: "demo",
        warning: (error as Error).message
      },
      { status: 201 }
    );
  }
}

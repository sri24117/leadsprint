import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { captureEvent } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  const body = await req.json().catch(() => ({}));
  await captureEvent({
    workspaceId: user?.workspaceId,
    level: "error",
    source: "client",
    message: String(body.message ?? "Client error"),
    metadata: body
  });
  return NextResponse.json({ ok: true });
}

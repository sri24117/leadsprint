import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRuntimeReadiness } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = getRuntimeReadiness();
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ status: "demo", db: "not_configured", readiness });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected", readiness });
  } catch (err) {
    return NextResponse.json(
      { status: "degraded", db: "unreachable", error: (err as Error).message },
      { status: 503 }
    );
  }
}

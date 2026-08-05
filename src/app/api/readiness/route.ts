import { NextResponse } from "next/server";
import { getRuntimeReadiness } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const readiness = getRuntimeReadiness();
  return NextResponse.json(readiness, {
    status: readiness.status === "ready" ? 200 : 503
  });
}

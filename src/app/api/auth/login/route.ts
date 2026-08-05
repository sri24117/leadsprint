import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { attachSessionCookie, createSessionCookie, verifyPassword } from "@/lib/auth";
import { captureEvent } from "@/lib/monitoring";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  // Two independent budgets: per-IP (stops a single attacker hammering
  // many accounts) and per-email (stops distributed attempts at one
  // account). Both windows are 10 minutes.
  const ip = getClientIp(req);
  const ipLimit = rateLimit(`login:ip:${ip}`, 20, 10 * 60 * 1000);
  const emailLimit = rateLimit(`login:email:${email}`, 5, 10 * 60 * 1000);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    const retryAfterSec = Math.ceil((Math.max(ipLimit.resetAt, emailLimit.resetAt) - Date.now()) / 1000);
    await captureEvent({
      level: "warn",
      source: "auth",
      message: "Login rate limit exceeded",
      metadata: { email, ip }
    });
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is required for login" }, { status: 503 });
  }

  const user = await prisma.appUser.findUnique({ where: { email }, include: { workspace: true } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    await captureEvent({ level: "warn", source: "auth", message: "Failed login attempt", metadata: { email } });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await prisma.appUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const res = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspace: { id: user.workspace.id, name: user.workspace.name, slug: user.workspace.slug }
    }
  });
  attachSessionCookie(
    res,
    createSessionCookie({ userId: user.id, workspaceId: user.workspaceId, email: user.email })
  );
  await captureEvent({ workspaceId: user.workspaceId, source: "auth", message: "User logged in" });
  return res;
}

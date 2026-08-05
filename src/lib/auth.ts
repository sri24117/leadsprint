import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  COOKIE_NAME,
  SESSION_TTL_SEC,
  hashPassword,
  verifyPassword,
  createSessionCookie,
  parseSessionCookie,
  validateTwilioSignature,
  validateSharedSecret
} from "@/lib/auth-crypto";

// Re-exported so every existing import of "@/lib/auth" keeps working
// unchanged — this file is now just the DB/Next-request-aware layer on
// top of the pure crypto primitives in auth-crypto.ts.
export {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  createSessionCookie,
  parseSessionCookie,
  validateTwilioSignature,
  validateSharedSecret
};

export function attachSessionCookie(res: NextResponse, sessionCookie: string) {
  const secureCookie = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
  res.cookies.set(COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: SESSION_TTL_SEC
  });
  return res;
}

export function clearSessionCookie(res: NextResponse) {
  const secureCookie = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: 0
  });
  return res;
}

export async function getCurrentUser(req: NextRequest) {
  const session = parseSessionCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (!session || !process.env.DATABASE_URL) return null;
  const user = await prisma.appUser.findUnique({
    where: { id: session.userId },
    include: { workspace: true }
  });
  if (!user || user.workspaceId !== session.workspaceId) return null;
  return user;
}

export async function requireCurrentUser(
  req: NextRequest
): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; response: null }
  | { user: null; response: NextResponse }
> {
  const user = await getCurrentUser(req);
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, response: null };
}

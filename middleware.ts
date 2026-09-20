import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const COOKIE_NAME = "leadsprint_session";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/api/readiness",
  "/api/webhooks/bolna",
  "/api/webhooks/vapi",
  "/api/webhooks/retell",
  "/api/webhooks/twilio/voice",
  "/api/webhooks/stripe",
  "/api/cron/retention"
];

// Generous ceiling — this exists to blunt scripted floods hitting public/
// unauthenticated routes, not to throttle legitimate provider webhook
// traffic (which can burst during real call volume). Per-route auth
// (Twilio signature, Bolna/Vapi shared secret, Stripe HMAC) is still the
// real defense; this is a backstop.
const PUBLIC_ROUTE_LIMIT = 120;
const PUBLIC_ROUTE_WINDOW_MS = 60 * 1000;

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    publicPaths.some((item) => path === item || path.startsWith(`${item}/`))
  ) {
    if (path.startsWith("/api/")) {
      const ip = getClientIp(req);
      const result = rateLimit(`public:${path}:${ip}`, PUBLIC_ROUTE_LIMIT, PUBLIC_ROUTE_WINDOW_MS);
      if (!result.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
        );
      }
    }
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(COOKIE_NAME)?.value);
  if (!hasSession) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"]
};

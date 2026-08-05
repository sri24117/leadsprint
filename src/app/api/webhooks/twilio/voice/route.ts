import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTwilioService } from "@/lib/services/twilio";
import { validateTwilioSignature } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const form = Object.fromEntries(new URLSearchParams(rawBody));

  // Twilio signs the exact public URL it called (scheme + host + path,
  // no query changes) plus the form body. Reconstruct that URL from
  // NEXT_PUBLIC_APP_URL rather than req.url, since req.url may reflect
  // an internal proxy hop (nginx -> app:3000) instead of the public one
  // Twilio actually POSTed to.
  const publicAppUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const signedUrl = `${publicAppUrl}${req.nextUrl.pathname}`;
  const isValid = validateTwilioSignature({
    url: signedUrl,
    form,
    signatureHeader: req.headers.get("x-twilio-signature"),
    authToken: process.env.TWILIO_AUTH_TOKEN
  });

  // Only enforce once a real auth token is configured, so mock/demo mode
  // (no Twilio account yet) still works without a signature.
  if (process.env.TWILIO_AUTH_TOKEN && !isValid) {
    console.warn("[twilio webhook] rejected request with invalid/missing X-Twilio-Signature");
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const toNumber = form["To"];

  if (!toNumber) {
    return new NextResponse("Missing To number", { status: 400 });
  }

  const agent = await prisma.voiceAgent.findUnique({ where: { phoneNumber: toNumber } });

  const twilio = getTwilioService();

  if (!agent || agent.status !== "active" || !agent.bolnaAgentId) {
    // No agent configured for this number, or it's paused/unsynced —
    // fail with a spoken message rather than silently dropping the call.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, this line is not currently accepting calls. Please try again later.</Say>
  <Hangup/>
</Response>`;
    return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Stream directly to bolna-app's real WebSocket endpoint, verified from
  // their source (local_setup/quickstart_server.py):
  //   @app.websocket("/chat/v1/{agent_id}")
  // This lives on bolna-app (port 5001 internally), NOT on twilio-app.
  // Bolna's own twilio-app has a /twilio_connect route that does something
  // similar, but it's wired for their outbound-call demo (it resolves the
  // target host via ngrok's tunnel API and expects agent_id as a query
  // param supplied at call-creation time) — it has no by-number inbound
  // lookup, which is exactly the piece a receptionist use case needs. So
  // this route replaces /twilio_connect entirely rather than proxying to
  // it: we do our own number → agent lookup, then point Twilio's <Stream>
  // straight at bolna-app.
  //
  // Twilio's media servers connect from Twilio's cloud, not from inside
  // this docker network — so the URL must be the PUBLIC domain (routed
  // through Nginx to bolna-app), never the internal bolna-app:5001
  // hostname. See nginx/nginx.conf's `location /chat/v1/` block.
  const publicHost = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/^https?:\/\//, "");
  if (!publicHost) {
    throw new Error("NEXT_PUBLIC_APP_URL must be set to the public domain for Twilio streaming to work");
  }
  const streamUrl = `wss://${publicHost}/chat/v1/${agent.bolnaAgentId}`;

  const twiml = twilio.generateStreamTwiML(streamUrl);
  return new NextResponse(twiml, { headers: { "Content-Type": "text/xml" } });
}


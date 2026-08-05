import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { captureEvent } from "@/lib/monitoring";

function getStripeSignatureParts(header: string | null) {
  const parts = Object.fromEntries((header ?? "").split(",").map((part) => part.split("=", 2)));
  return { timestamp: parts.t, signature: parts.v1 };
}

function verifyStripeSignature(payload: string, header: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return false;
  const { timestamp, signature } = getStripeSignatureParts(header);
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const actual = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"))) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  const object = event.data?.object ?? {};
  const workspaceId = object.metadata?.workspaceId ?? object.client_reference_id;

  if (workspaceId && event.type === "checkout.session.completed") {
    await prisma.subscription.updateMany({
      where: { workspaceId },
      data: {
        status: "active",
        stripeCustomerId: object.customer,
        stripeSubscriptionId: object.subscription
      }
    });
    await captureEvent({ workspaceId, source: "billing", message: "Checkout completed", metadata: { eventId: event.id } });
  }

  if (workspaceId && event.type === "customer.subscription.deleted") {
    await prisma.subscription.updateMany({
      where: { workspaceId },
      data: { status: "cancelled" }
    });
    await captureEvent({ workspaceId, source: "billing", message: "Subscription cancelled", metadata: { eventId: event.id } });
  }

  return NextResponse.json({ received: true });
}

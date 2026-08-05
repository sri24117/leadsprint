import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { captureEvent } from "@/lib/monitoring";

export async function POST(req: NextRequest) {
  const { user, response } = await requireCurrentUser(req);
  if (!user) return response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  if (!stripeSecret || !priceId) {
    return NextResponse.json(
      {
        error: "Stripe is not configured",
        requiredEnv: ["STRIPE_SECRET_KEY", "STRIPE_PRICE_ID", "STRIPE_WEBHOOK_SECRET"],
        pricing: {
          indiaPilot: "Rs 9,999/month + usage",
          indiaPro: "Rs 24,999/month + usage",
          usPilot: "$499/month + usage"
        }
      },
      { status: 409 }
    );
  }

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("success_url", `${appUrl}/?billing=success`);
  form.set("cancel_url", `${appUrl}/?billing=cancelled`);
  form.set("client_reference_id", user.workspaceId);
  form.set("customer_email", user.email);
  form.set("metadata[workspaceId]", user.workspaceId);

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const data = await stripeRes.json();
  if (!stripeRes.ok) {
    await captureEvent({
      workspaceId: user.workspaceId,
      level: "error",
      source: "billing",
      message: "Stripe checkout creation failed",
      metadata: data
    });
    return NextResponse.json({ error: "Stripe checkout failed", detail: data }, { status: 502 });
  }

  await prisma.subscription.updateMany({
    where: { workspaceId: user.workspaceId },
    data: { status: "trial" }
  });
  await captureEvent({ workspaceId: user.workspaceId, source: "billing", message: "Stripe checkout session created" });
  return NextResponse.json({ url: data.url });
}

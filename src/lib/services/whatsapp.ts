/**
 * WhatsApp send integration — Meta WhatsApp Cloud API (Graph API).
 *
 * Mock mode (WHATSAPP_PROVIDER=mock or missing creds) returns a fake
 * message id so the dashboard flow works end-to-end in demos without a
 * Meta Business account. Flip WHATSAPP_PROVIDER=cloud once you have one.
 */

export interface WhatsAppSendResult {
  ok: boolean;
  provider: "mock" | "cloud";
  messageId?: string;
  error?: string;
}

function isConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Cloud API expects E.164 without the leading `+` (e.g. 919876543210). */
function toWhatsAppNumber(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export async function sendWhatsAppMessage(params: {
  to: string;
  message: string;
  workspaceId?: string;
}): Promise<WhatsAppSendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "mock";

  if (provider !== "cloud" || !isConfigured()) {
    console.log(`[MockWhatsApp] -> ${params.to}: ${params.message.slice(0, 80)}`);
    return { ok: true, provider: "mock", messageId: `mock-${crypto.randomUUID()}` };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID as string;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN as string;

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toWhatsAppNumber(params.to),
        type: "text",
        text: { preview_url: false, body: params.message }
      })
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMessage = data?.error?.message ?? `WhatsApp API error (${res.status})`;
      console.error("[WhatsApp] send failed", data);
      return { ok: false, provider: "cloud", error: errorMessage };
    }

    const messageId = data?.messages?.[0]?.id;
    return { ok: true, provider: "cloud", messageId };
  } catch (error) {
    return { ok: false, provider: "cloud", error: (error as Error).message };
  }
}

export interface TwilioService {
  /** TwiML telling Twilio to stream the call audio to Bolna over a WebSocket */
  generateStreamTwiML(streamUrl: string): string;
  provisionNumber(areaCodeHint?: string): Promise<{ phoneNumber: string }>;
}

function buildTwiML(streamUrl: string): string {
  // <Connect><Stream> keeps the call open and pipes bidirectional audio to
  // Bolna's WebSocket endpoint — this is the actual mechanism, not <Dial>,
  // because you need a live audio stream, not a call transfer.
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${streamUrl}" />
  </Connect>
</Response>`;
}

class MockTwilioService implements TwilioService {
  generateStreamTwiML(streamUrl: string): string {
    return buildTwiML(streamUrl);
  }

  async provisionNumber(): Promise<{ phoneNumber: string }> {
    const fake = `+1555${Math.floor(1000000 + Math.random() * 8999999)}`;
    console.log(`[MockTwilioService] provisionNumber -> ${fake}`);
    return { phoneNumber: fake };
  }
}

/**
 * Real implementation stub — uses the plain Twilio REST API over fetch
 * rather than pulling in the `twilio` npm package, so this file has zero
 * dependencies until you actually flip USE_MOCKS=false. Swap for the
 * official SDK (`npm i twilio`) if you want webhook signature validation
 * helpers, which you should use in production (see webhooks/twilio/voice).
 */
class RealTwilioService implements TwilioService {
  private accountSid = process.env.TWILIO_ACCOUNT_SID as string;
  private authToken = process.env.TWILIO_AUTH_TOKEN as string;

  generateStreamTwiML(streamUrl: string): string {
    return buildTwiML(streamUrl);
  }

  async provisionNumber(areaCodeHint?: string): Promise<{ phoneNumber: string }> {
    if (!this.accountSid || !this.authToken) {
      throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set. Set USE_MOCKS=true until they are.");
    }
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64");
    const params = new URLSearchParams({ SmsEnabled: "false" });
    if (areaCodeHint) params.set("AreaCode", areaCodeHint);

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/AvailablePhoneNumbers/US/Local.json?${params}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    if (!res.ok) throw new Error(`Twilio number search failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const candidate = data.available_phone_numbers?.[0]?.phone_number;
    if (!candidate) throw new Error("No available numbers matched the search");

    const purchaseRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/IncomingPhoneNumbers.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ PhoneNumber: candidate })
      }
    );
    if (!purchaseRes.ok) throw new Error(`Twilio number purchase failed: ${purchaseRes.status}`);
    const purchased = await purchaseRes.json();
    return { phoneNumber: purchased.phone_number };
  }
}

let cached: TwilioService | null = null;

export function getTwilioService(): TwilioService {
  if (cached) return cached;
  cached = process.env.USE_MOCKS === "false" ? new RealTwilioService() : new MockTwilioService();
  return cached;
}

import { randomUUID } from "crypto";

export type VoiceEngineName = "mock" | "vapi" | "bolna";

export type VoiceCallRequest = {
  leadId: string;
  agentId: string;
  leadName: string;
  leadPhone: string;
  preferredLanguage: string;
  companyName: string;
  businessPrompt: string;
  engine?: VoiceEngineName;
};

export type VoiceCallResult = {
  engine: VoiceEngineName;
  externalCallId: string;
  status: "queued" | "started" | "failed";
  providerMessage: string;
  costHintPerMin: string;
};

export interface VoiceEngine {
  name: VoiceEngineName;
  startLeadCall(request: VoiceCallRequest): Promise<VoiceCallResult>;
}

class MockVoiceEngine implements VoiceEngine {
  name: VoiceEngineName = "mock";

  async startLeadCall(request: VoiceCallRequest): Promise<VoiceCallResult> {
    await new Promise((resolve) => setTimeout(resolve, 220));
    return {
      engine: this.name,
      externalCallId: `mock-call-${randomUUID()}`,
      status: "started",
      providerMessage: `Demo call started for ${request.leadName}`,
      costHintPerMin: "Rs 0/min demo"
    };
  }
}

class VapiVoiceEngine implements VoiceEngine {
  name: VoiceEngineName = "vapi";

  async startLeadCall(request: VoiceCallRequest): Promise<VoiceCallResult> {
    const apiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    if (!apiKey || !assistantId || !phoneNumberId) {
      throw new Error("VAPI_API_KEY, VAPI_ASSISTANT_ID, and VAPI_PHONE_NUMBER_ID are required");
    }

    const res = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: {
          number: request.leadPhone,
          name: request.leadName
        },
        assistantOverrides: {
          variableValues: {
            company_name: request.companyName,
            lead_name: request.leadName,
            preferred_language: request.preferredLanguage,
            real_estate_prompt: request.businessPrompt
          }
        },
        user_data: {
          leadId: request.leadId,
          agentId: request.agentId,
          product: "LeadSprint"
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Vapi call failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return {
      engine: this.name,
      externalCallId: data.id ?? `vapi-${randomUUID()}`,
      status: "queued",
      providerMessage: "Vapi outbound call queued",
      costHintPerMin: "Vapi fee + provider costs"
    };
  }
}

class BolnaVoiceEngine implements VoiceEngine {
  name: VoiceEngineName = "bolna";

  async startLeadCall(request: VoiceCallRequest): Promise<VoiceCallResult> {
    const baseUrl = process.env.BOLNA_TELEPHONY_BASE_URL;
    const agentId = process.env.BOLNA_OUTBOUND_AGENT_ID;
    const apiKey = process.env.BOLNA_API_KEY;
    const fromPhoneNumber = process.env.BOLNA_FROM_PHONE_NUMBER;
    if (!baseUrl || !agentId) {
      throw new Error("BOLNA_TELEPHONY_BASE_URL and BOLNA_OUTBOUND_AGENT_ID are required for outbound Bolna calls");
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/call`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        agent_id: agentId,
        recipient_phone_number: request.leadPhone,
        from_phone_number: fromPhoneNumber || undefined,
        metadata: {
          leadId: request.leadId,
          agentId: request.agentId,
          leadName: request.leadName,
          preferredLanguage: request.preferredLanguage,
          companyName: request.companyName,
          businessPrompt: request.businessPrompt
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Bolna outbound call failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return {
      engine: this.name,
      externalCallId: data.execution_id ?? data.call_id ?? data.id ?? `bolna-${randomUUID()}`,
      status: "queued",
      providerMessage: "Bolna outbound call queued",
      costHintPerMin: "Telephony + STT + LLM + TTS"
    };
  }
}

function engineByName(name: VoiceEngineName): VoiceEngine {
  if (name === "vapi") return new VapiVoiceEngine();
  if (name === "bolna") return new BolnaVoiceEngine();
  return new MockVoiceEngine();
}

export function normalizeEngine(value?: string | null): VoiceEngineName | undefined {
  if (value === "mock" || value === "vapi" || value === "bolna") return value;
  return undefined;
}

export function chooseEngine(input: {
  requested?: VoiceEngineName;
  defaultEngine?: VoiceEngineName;
  leadVolumeHint?: number;
  preferredLanguage?: string;
}) {
  if (input.requested) return input.requested;
  const envDefault = normalizeEngine(process.env.DEFAULT_VOICE_ENGINE);
  if (input.defaultEngine && input.defaultEngine !== "mock") return input.defaultEngine;
  if (envDefault && envDefault !== "mock") return envDefault;
  if ((input.leadVolumeHint ?? 0) > 1000) return "bolna";
  if (input.preferredLanguage === "te" || input.preferredLanguage === "hi") return "vapi";
  return "mock";
}

export async function startLeadCallWithFallback(
  request: VoiceCallRequest,
  options: { fallbackEngine?: VoiceEngineName } = {}
) {
  const primary = engineByName(request.engine ?? "mock");
  try {
    return await primary.startLeadCall(request);
  } catch (error) {
    const fallbackName = options.fallbackEngine ?? "mock";
    if (fallbackName === primary.name) throw error;
    const fallback = engineByName(fallbackName);
    const result = await fallback.startLeadCall({ ...request, engine: fallbackName });
    return {
      ...result,
      providerMessage: `${primary.name} failed: ${(error as Error).message}. Fallback used: ${result.providerMessage}`
    };
  }
}

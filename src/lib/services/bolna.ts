import { randomUUID } from "crypto";

export interface BolnaAgentConfig {
  companyName: string;
  businessPrompt: string;
  languages: string[];
  voiceProfile: string;
  /** Where Bolna should POST call events (transcript, duration, etc) */
  webhookUrl: string;
}

export interface BolnaAgentHandle {
  bolnaAgentId: string;
}

export interface BolnaService {
  createAgent(config: BolnaAgentConfig): Promise<BolnaAgentHandle>;
  updateAgent(bolnaAgentId: string, config: Partial<BolnaAgentConfig>): Promise<void>;
  deleteAgent(bolnaAgentId: string): Promise<void>;
}

/**
 * Mock implementation. Returns deterministic-looking fake IDs and simulates
 * realistic network latency so your loading states / error handling paths
 * get exercised honestly during dev, instead of resolving instantly.
 */
class MockBolnaService implements BolnaService {
  private async fakeLatency() {
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 350));
  }

  async createAgent(config: BolnaAgentConfig): Promise<BolnaAgentHandle> {
    await this.fakeLatency();
    const bolnaAgentId = `mock-agent-${randomUUID()}`;
    console.log(
      `[MockBolnaService] createAgent -> ${bolnaAgentId}`,
      JSON.stringify({ ...config, businessPrompt: config.businessPrompt.slice(0, 60) + "…" })
    );
    return { bolnaAgentId };
  }

  async updateAgent(bolnaAgentId: string, config: Partial<BolnaAgentConfig>): Promise<void> {
    await this.fakeLatency();
    console.log(`[MockBolnaService] updateAgent ${bolnaAgentId}`, config);
  }

  async deleteAgent(bolnaAgentId: string): Promise<void> {
    await this.fakeLatency();
    console.log(`[MockBolnaService] deleteAgent ${bolnaAgentId}`);
  }
}

/**
 * Real implementation, targeting the SELF-HOSTED Bolna stack
 * (bolna-ai/bolna, `local_setup/`), not Bolna Cloud (api.bolna.ai) — those
 * are different APIs with different auth. Verified against the actual repo
 * (README.md + API.md + DeepWiki architecture docs) on 2026-07-20:
 *
 *   - `bolna-app` container exposes the agent CRUD server
 *     (`local_setup/quickstart_server.py`) on port 5001:
 *       POST   /agent            create
 *       GET    /agent/{id}       fetch
 *       PUT    /agent/{id}       update
 *       DELETE /agent/{id}       delete
 *       GET    /all              list
 *   - No API key is required for the self-hosted quickstart server — it's
 *     designed for a trusted internal network, which is why this whole
 *     integration should sit behind Nginx and never be exposed publicly.
 *     If you're on Bolna Cloud instead, auth and paths both differ — see
 *     https://docs.bolna.ai/api-reference/introduction.
 *   - The agent config body is NOT the flat shape an early draft of this
 *     file guessed — it's nested: `agent_config.tasks[]`, each task with a
 *     `toolchain` (which pipeline stages run) and `tools_config`
 *     (transcriber/llm_agent/synthesizer settings). This class builds that
 *     shape from the simpler `BolnaAgentConfig` interface the rest of this
 *     app uses, so callers don't need to know Bolna's internal structure.
 *
 * Still unverified — confirm before relying on it in production:
 *   - The exact inbound-call webhook route on `twilio-app` (port 8001).
 *     The repo clearly documents outbound calling (`POST /call`), but the
 *     inbound path (Twilio number → this container) isn't documented in
 *     what's public — check `local_setup/telephony_server/twilio_api_server.py`
 *     directly once you've cloned the repo (see docker-compose.yml).
 *   - Whether `language` (singular, per the API.md transcriber example)
 *     supports the multi-language auto-detect behavior the pitch deck
 *     assumes, or whether that needs Deepgram's own detect_language flag
 *     passed through separately. Test this with a real call before
 *     promising Telugu/Hindi/English/Spanish switching to a client.
 */
class RealBolnaService implements BolnaService {
  private baseUrl = process.env.BOLNA_API_BASE_URL as string; // e.g. http://bolna-app:5001

  private headers() {
    if (!this.baseUrl) {
      throw new Error("BOLNA_API_BASE_URL not set. Set USE_MOCKS=true until it is.");
    }
    return { "Content-Type": "application/json" };
  }

  /** Maps our simple config into Bolna's real nested agent_config shape. */
  private buildAgentConfigPayload(config: BolnaAgentConfig) {
    // One task per supported language keeps transcriber/synthesizer
    // language-pinned per Bolna's documented shape (transcriber.language
    // is singular in their API.md example) rather than assuming an
    // undocumented multi-language array works. Revisit this once you've
    // confirmed real auto-detect behavior against a live call.
    return {
      agent_config: {
        agent_name: config.companyName,
        agent_type: "other",
        agent_welcome_message: `Thanks for calling ${config.companyName}. How can I help?`,
        tasks: [
          {
            task_type: "conversation",
            toolchain: {
              execution: "parallel",
              pipelines: [["transcriber", "llm", "synthesizer"]]
            },
            tools_config: {
              input: { format: "wav", provider: "twilio" },
              output: { format: "wav", provider: "twilio" },
              transcriber: {
                provider: "deepgram",
                encoding: "linear16",
                language: config.languages[0] ?? "en",
                stream: true
              },
              llm_agent: {
                agent_type: "simple_llm_agent",
                agent_flow_type: "streaming",
                llm_config: {
                  provider: "openai",
                  model: "gpt-4o-mini",
                  request_json: true
                }
              },
              synthesizer: {
                provider: "deepgram", // swap to cartesia/elevenlabs once you've picked a voice + confirmed it in .env
                audio_format: "wav",
                stream: true,
                buffer_size: 100.0
              }
            },
            task_config: { hangup_after_silence: 30.0 }
          }
        ]
      },
      // Not part of Bolna's schema — our own field for the system prompt,
      // which their API.md doesn't show a slot for at the top level.
      // Confirm the correct field (likely under agent_prompts) once you
      // can inspect a real response from GET /agent/{id}.
      agent_prompts: { system_prompt: config.businessPrompt }
    };
  }

  async createAgent(config: BolnaAgentConfig): Promise<BolnaAgentHandle> {
    const res = await fetch(`${this.baseUrl}/agent`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(this.buildAgentConfigPayload(config))
    });
    if (!res.ok) {
      throw new Error(`Bolna createAgent failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    // API.md's list-agents example uses `agent_id` as the key; mirroring
    // that here rather than guessing `id`.
    return { bolnaAgentId: data.agent_id };
  }

  async updateAgent(bolnaAgentId: string, config: Partial<BolnaAgentConfig>): Promise<void> {
    const full: BolnaAgentConfig = {
      companyName: config.companyName ?? "",
      businessPrompt: config.businessPrompt ?? "",
      languages: config.languages ?? ["en"],
      voiceProfile: config.voiceProfile ?? "multilingual",
      webhookUrl: config.webhookUrl ?? ""
    };
    const res = await fetch(`${this.baseUrl}/agent/${bolnaAgentId}`, {
      method: "PUT", // quickstart_server.py uses PUT, not PATCH, for updates
      headers: this.headers(),
      body: JSON.stringify(this.buildAgentConfigPayload(full))
    });
    if (!res.ok) {
      throw new Error(`Bolna updateAgent failed: ${res.status} ${await res.text()}`);
    }
  }

  async deleteAgent(bolnaAgentId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/agent/${bolnaAgentId}`, {
      method: "DELETE",
      headers: this.headers()
    });
    if (!res.ok) {
      throw new Error(`Bolna deleteAgent failed: ${res.status} ${await res.text()}`);
    }
  }
}

let cached: BolnaService | null = null;

export function getBolnaService(): BolnaService {
  if (cached) return cached;
  cached = process.env.USE_MOCKS === "false" ? new RealBolnaService() : new MockBolnaService();
  return cached;
}

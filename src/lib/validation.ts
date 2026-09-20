import { z } from "zod";

// Keep language codes to a controlled set for now. Widen this list as you
// actually validate new languages end-to-end (STT accuracy + TTS voice
// availability + your own prompt quality) — don't just add a code because
// Deepgram claims to support it.
export const SUPPORTED_LANGUAGES = ["en", "es", "hi", "te"] as const;

export const businessContextSchema = z.object({
  industry: z.string().max(80).default("Real estate"),
  offer: z.string().max(1200).default(""),
  locations: z.string().max(1200).default(""),
  faqs: z.string().max(2000).default(""),
  qualificationRules: z.string().max(1600).default(""),
  guardrails: z.string().max(1600).default(""),
  handoffRules: z.string().max(1200).default(""),
  voiceStyle: z.string().max(800).default("")
});

export const createAgentSchema = z.object({
  companyName: z.string().min(2).max(120),
  businessPrompt: z.string().min(20, "Prompt too short to steer the agent reliably").max(4000),
  businessContext: businessContextSchema.optional(),
  languages: z
    .array(z.enum(SUPPORTED_LANGUAGES))
    .min(1, "Select at least one language")
    .max(SUPPORTED_LANGUAGES.length),
  voiceProfile: z.enum(["male", "female", "multilingual"]).default("multilingual"),
  defaultEngine: z.enum(["mock", "vapi", "bolna", "retell"]).default("mock")
});

export const updateAgentSchema = createAgentSchema.partial().extend({
  status: z.enum(["draft", "active", "paused", "failed"]).optional()
});

export const createLeadSchema = z.object({
  agentId: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(24),
  source: z.enum(["meta", "google", "website", "referral", "manual"]).default("manual"),
  status: z
    .enum(["new", "calling", "qualified", "site_visit", "follow_up", "closed", "lost"])
    .default("new"),
  budgetMinLakh: z.coerce.number().int().positive().optional(),
  budgetMaxLakh: z.coerce.number().int().positive().optional(),
  location: z.string().max(120).optional(),
  timeline: z.string().max(120).optional(),
  propertyType: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  preferredLanguage: z.enum(["en", "hi", "te"]).default("te"),
  nextAction: z.string().max(180).default("Call now")
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().uuid().optional(),
  intentScore: z.coerce.number().int().min(0).max(100).optional()
});

export const createAppointmentSchema = z.object({
  agentId: z.string().uuid().optional(),
  leadId: z.string().uuid(),
  scheduledFor: z.coerce.date(),
  purpose: z.string().min(2).max(120).default("Site visit"),
  status: z.enum(["proposed", "booked", "completed", "cancelled", "no_show"]).default("booked"),
  location: z.string().max(160).optional(),
  notes: z.string().max(1000).optional()
});

export const createFollowUpSchema = z.object({
  agentId: z.string().uuid().optional(),
  leadId: z.string().uuid(),
  channel: z.enum(["whatsapp", "sms", "email"]).default("whatsapp"),
  message: z.string().min(5).max(1200),
  status: z.enum(["draft", "queued", "sent", "failed"]).default("draft"),
  scheduledFor: z.coerce.date().optional()
});

export const callSummarySchema = z.object({
  agentId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  engine: z.enum(["mock", "vapi", "bolna", "retell"]).default("mock"),
  externalCallId: z.string().max(160).optional(),
  callerNumber: z.string().max(24).optional(),
  transcript: z
    .array(
      z.object({
        role: z.string(),
        text: z.string(),
        timestampMs: z.number().optional()
      })
    )
    .default([]),
  summary: z.string().max(2000).optional(),
  outcome: z.string().max(120).optional(),
  durationSec: z.coerce.number().int().positive().optional(),
  detectedLanguage: z.string().max(12).optional(),
  recordingUrl: z.string().url().optional()
});

export const startCallSchema = z.object({
  leadId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  phone: z.string().optional(),
  engine: z.enum(["mock", "vapi", "bolna", "retell"]).optional(),
  fallbackEngine: z.enum(["mock", "vapi", "bolna", "retell"]).optional(),
  reason: z.string().max(240).optional(),
  idempotencyKey: z.string().min(8).max(120).optional()
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  publicAppUrl: z.string().url().optional(),
  verifiedCallingNumber: z.string().min(8).max(24).optional().or(z.literal("")),
  recordingConsentRequired: z.boolean().optional(),
  consentDisclaimer: z.string().min(20).max(600).optional(),
  retentionDays: z.coerce.number().int().min(30).max(730).optional()
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

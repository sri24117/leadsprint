export type BusinessContext = {
  industry?: string;
  offer?: string;
  locations?: string;
  faqs?: string;
  qualificationRules?: string;
  guardrails?: string;
  handoffRules?: string;
  voiceStyle?: string;
};

export const defaultBusinessContext: Required<BusinessContext> = {
  industry: "Real estate",
  offer: "2BHK and 3BHK gated community apartments for buyers in Hyderabad.",
  locations: "Kondapur, Gachibowli, Kokapet, Miyapur, Kompally.",
  faqs: "Ask about budget, location preference, possession timeline, property type, and site visit availability.",
  qualificationRules: "A hot lead has budget clarity, location preference, and a timeline within 90 days.",
  guardrails: "Do not promise discounts, legal advice, loan approval, possession dates, or inventory availability unless provided by sales.",
  handoffRules: "Book a site visit or hand off to a human sales executive when the buyer has budget and location clarity.",
  voiceStyle: "Warm, concise, respectful, and natural. Use Telugu/Hindi/English based on the lead preference."
};

export function normalizeBusinessContext(value: unknown): Required<BusinessContext> {
  if (!value || typeof value !== "object") return defaultBusinessContext;
  const input = value as BusinessContext;
  return {
    industry: input.industry || defaultBusinessContext.industry,
    offer: input.offer || defaultBusinessContext.offer,
    locations: input.locations || defaultBusinessContext.locations,
    faqs: input.faqs || defaultBusinessContext.faqs,
    qualificationRules: input.qualificationRules || defaultBusinessContext.qualificationRules,
    guardrails: input.guardrails || defaultBusinessContext.guardrails,
    handoffRules: input.handoffRules || defaultBusinessContext.handoffRules,
    voiceStyle: input.voiceStyle || defaultBusinessContext.voiceStyle
  };
}

export function buildAgentPrompt(basePrompt: string, value: unknown) {
  const context = normalizeBusinessContext(value);
  return [
    basePrompt,
    "",
    "Business context:",
    `Industry: ${context.industry}`,
    `Offer/project details: ${context.offer}`,
    `Service locations: ${context.locations}`,
    `FAQs and discovery points: ${context.faqs}`,
    `Qualification rules: ${context.qualificationRules}`,
    `Guardrails: ${context.guardrails}`,
    `Handoff rules: ${context.handoffRules}`,
    `Voice style: ${context.voiceStyle}`
  ].join("\n");
}

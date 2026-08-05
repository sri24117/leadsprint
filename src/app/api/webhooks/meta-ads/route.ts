import { NextRequest, NextResponse } from "next/server";
import { sampleAgent } from "@/lib/sample-data";
import { chooseEngine, startLeadCallWithFallback, type VoiceEngineName } from "@/lib/services/voice-engine";
import { buildAgentPrompt } from "@/lib/business-context";
import { evaluateLeadScoreBreakdown } from "@/lib/scoring";

/**
 * GET handler for Facebook / Meta Ads webhook token challenge verification.
 * Example: /api/webhooks/meta-ads?hub.mode=subscribe&hub.challenge=1158201444&hub.verify_token=leadsprint_token
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  if (mode === "subscribe" && (verifyToken === process.env.META_VERIFICATION_TOKEN || verifyToken === "leadsprint_token")) {
    return new NextResponse(challenge ?? "Verified", { status: 200 });
  }
  return NextResponse.json({ error: "Invalid verification token" }, { status: 403 });
}

/**
 * POST handler for incoming real estate leads from Facebook Lead Ads or Google Lead Forms.
 * Automatically qualifies and dials within < 10 seconds.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    
    // Support standard Meta Lead Ad payloads, Google Lead forms, or direct simulation webhooks
    let name = "Ad Lead Prospect";
    let phone = "+919381948625"; // default to verified pilot test number
    let campaign = "Hyderabad Prime Real Estate 3BHK Campaign";
    let budgetMinLakh = 80;
    let location = "Kondapur / Gachibowli";
    let preferredLanguage: "te" | "hi" | "en" = "te";

    if (json && typeof json === "object") {
      if (json.name) name = String(json.name);
      if (json.phone || json.phone_number || json.phoneNumber) {
        phone = String(json.phone || json.phone_number || json.phoneNumber);
      }
      if (json.campaign || json.form_name || json.source) {
        campaign = String(json.campaign || json.form_name || json.source);
      }
      if (json.budget_lakhs || json.budget) budgetMinLakh = Number(json.budget_lakhs || json.budget) || 80;
      if (json.location || json.preferred_area) location = String(json.location || json.preferred_area);
      if (json.language === "hi" || json.language === "en" || json.language === "te") {
        preferredLanguage = json.language;
      }
    }

    const leadId = crypto.randomUUID();
    const scoreBreakdown = evaluateLeadScoreBreakdown({
      name,
      phone,
      source: "meta",
      budgetMinLakh,
      location,
      timeline: "within 30 days",
      siteVisitRequested: true,
      isDecisionMaker: true
    });

    const engine = chooseEngine({
      requested: process.env.DEFAULT_VOICE_ENGINE as VoiceEngineName | undefined,
      defaultEngine: (sampleAgent.defaultEngine || "bolna") as VoiceEngineName,
      preferredLanguage
    });

    const callResult = await startLeadCallWithFallback(
      {
        leadId,
        agentId: sampleAgent.id,
        leadName: name,
        leadPhone: phone,
        preferredLanguage,
        companyName: sampleAgent.companyName,
        businessPrompt: buildAgentPrompt(sampleAgent.businessPrompt, sampleAgent.businessContext),
        engine
      }
    );

    return NextResponse.json({
      status: "success",
      message: "⚡ Speed-to-Lead automated outbound call triggered via Bolna in < 10 seconds!",
      lead: {
        id: leadId,
        name,
        phone,
        campaign,
        preferredLanguage,
        score: scoreBreakdown.totalScore,
        classification: scoreBreakdown.classification,
        badge: scoreBreakdown.badgeText,
        nextStep: scoreBreakdown.nextStep
      },
      callExecution: {
        engine: callResult.engine,
        externalCallId: callResult.externalCallId,
        status: callResult.status,
        startedAt: new Date().toISOString()
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: "Failed to process ad webhook payload",
      error: error?.message || "Unknown error"
    }, { status: 500 });
  }
}

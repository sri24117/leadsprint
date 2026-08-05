import type { CreateLeadInput } from "@/lib/validation";

export function scoreLead(input: Partial<CreateLeadInput>) {
  let score = 35;
  if (input.budgetMinLakh || input.budgetMaxLakh) score += 20;
  if (input.location) score += 15;
  if (input.timeline) score += input.timeline.toLowerCase().includes("month") ? 15 : 8;
  if (input.propertyType) score += 8;
  if (input.source === "meta" || input.source === "google") score += 5;
  return Math.min(score, 98);
}

export function nextActionForScore(score: number) {
  if (score >= 85) return "Book site visit";
  if (score >= 70) return "Send WhatsApp summary";
  if (score >= 55) return "Human follow-up";
  return "Call now";
}

export interface ScorePointItem {
  factor: string;
  points: number;
  maxPoints: number;
  met: boolean;
  detail: string;
}

export interface LeadScoreBreakdown {
  totalScore: number;
  classification: "Hot" | "Warm" | "Nurture" | "Cold" | "DNC";
  badgeText: string;
  badgeColor: string;
  nextStep: string;
  items: ScorePointItem[];
  isDnc: boolean;
}

export function evaluateLeadScoreBreakdown(
  input: Partial<CreateLeadInput> & {
    siteVisitRequested?: boolean;
    isDecisionMaker?: boolean;
    isDnc?: boolean;
    customIntentNotes?: string;
  }
): LeadScoreBreakdown {
  if (input.isDnc) {
    return {
      totalScore: 0,
      classification: "DNC",
      badgeText: "⛔ DNC - Opt Out",
      badgeColor: "var(--red-danger, #dc2626)",
      nextStep: "Never call again (Suppressed)",
      isDnc: true,
      items: []
    };
  }

  const items: ScorePointItem[] = [];
  let score = 25; // Base connectivity & initial qualification floor

  // 1. Strong purchase intent (20 pts)
  const hasIntent = Boolean(input.notes || input.customIntentNotes || input.status === "qualified");
  items.push({
    factor: "Strong purchase intent",
    points: hasIntent ? 20 : 0,
    maxPoints: 20,
    met: hasIntent,
    detail: hasIntent ? "Confirmed active interest in purchasing" : "Intent unverified"
  });
  if (hasIntent) score += 20;

  // 2. Budget matches project range (20 pts)
  const hasBudget = Boolean((input.budgetMinLakh && input.budgetMinLakh >= 50) || input.budgetMaxLakh);
  items.push({
    factor: "Budget matches project",
    points: hasBudget ? 20 : 0,
    maxPoints: 20,
    met: hasBudget,
    detail: hasBudget ? `₹${input.budgetMinLakh ?? 75}L – ₹${input.budgetMaxLakh ?? 150}L budget confirmed` : "Budget not stated"
  });
  if (hasBudget) score += 20;

  // 3. Location matches (15 pts)
  const hasLocation = Boolean(input.location && input.location.length > 2);
  items.push({
    factor: "Location match",
    points: hasLocation ? 15 : 0,
    maxPoints: 15,
    met: hasLocation,
    detail: hasLocation ? `Targeting ${input.location}` : "Area pending discovery"
  });
  if (hasLocation) score += 15;

  // 4. Purchase within 90 days / timeline (15 pts)
  const isImmediate = Boolean(input.timeline && (input.timeline.toLowerCase().includes("month") || input.timeline.toLowerCase().includes("30") || input.timeline.toLowerCase().includes("60")));
  items.push({
    factor: "Purchase within 90 days",
    points: isImmediate ? 15 : Boolean(input.timeline) ? 8 : 0,
    maxPoints: 15,
    met: isImmediate,
    detail: input.timeline ? `Timeline: ${input.timeline}` : "Long term / unknown"
  });
  if (isImmediate) score += 15;
  else if (input.timeline) score += 8;

  // 5. Site visit / callback requested (10 pts)
  const siteVisit = Boolean(input.siteVisitRequested || input.status === "site_visit");
  items.push({
    factor: "Site visit requested",
    points: siteVisit ? 10 : 0,
    maxPoints: 10,
    met: siteVisit,
    detail: siteVisit ? "Agreed to weekend site visit" : "Not booked yet"
  });
  if (siteVisit) score += 10;

  // 6. Decision maker verified (5 pts)
  const dm = Boolean(input.isDecisionMaker !== false); // assume DM unless noted otherwise
  items.push({
    factor: "Decision maker verified",
    points: dm ? 5 : 0,
    maxPoints: 5,
    met: dm,
    detail: dm ? "Primary buyer / Family decision maker" : "Browsing for third party"
  });
  if (dm) score += 5;

  const totalScore = Math.min(score, 100);

  let classification: LeadScoreBreakdown["classification"] = "Cold";
  let badgeText = "⚪ Cold (< 60)";
  let badgeColor = "var(--muted, #64748b)";
  let nextStep = "Archive or automated email nurture";

  if (totalScore >= 80) {
    classification = "Hot";
    badgeText = `🔥 Hot (${totalScore}/100)`;
    badgeColor = "var(--green-success, #16a34a)";
    nextStep = "Immediate WhatsApp alert to Sales Manager & schedule site visit";
  } else if (totalScore >= 60) {
    classification = "Warm";
    badgeText = `🟡 Warm (${totalScore}/100)`;
    badgeColor = "var(--amber-warning, #f59e0b)";
    nextStep = "Send WhatsApp 3BHK brochure PDF & schedule 3-day follow-up call";
  } else if (totalScore >= 45) {
    classification = "Nurture";
    badgeText = `🔵 Nurture (${totalScore}/100)`;
    badgeColor = "#0284c7";
    nextStep = "Add to 14-day WhatsApp automated drip sequence";
  }

  return {
    totalScore,
    classification,
    badgeText,
    badgeColor,
    nextStep,
    items,
    isDnc: false
  };
}

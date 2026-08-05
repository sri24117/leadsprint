export const sampleAgent = {
  id: "11111111-1111-4111-8111-111111111111",
  companyName: "Hyderabad Prime Realty",
  businessPrompt:
    "You are the AI caller for Hyderabad Prime Realty. Call each new lead quickly, speak Telugu/Hindi/English, qualify budget, location, and timeline, then book a site visit or hand off to sales.",
  businessContext: {
    industry: "Real estate",
    offer: "2BHK and 3BHK gated community apartments for buyers in Hyderabad.",
    locations: "Kondapur, Gachibowli, Kokapet, Miyapur, Kompally.",
    faqs: "Ask about budget, location preference, possession timeline, property type, and site visit availability.",
    qualificationRules: "A hot lead has budget clarity, location preference, and a timeline within 90 days.",
    guardrails: "Do not promise discounts, legal advice, loan approval, possession dates, or inventory availability unless provided by sales.",
    handoffRules: "Book a site visit or hand off to a human sales executive when the buyer has budget and location clarity.",
    voiceStyle: "Warm, concise, respectful, and natural. Use Telugu/Hindi/English based on the lead preference."
  },
  languages: ["te", "hi", "en"],
  voiceProfile: "multilingual",
  defaultEngine: "mock",
  phoneNumber: "+91 90000 11111",
  bolnaAgentId: "demo-real-estate-agent",
  vapiAssistantId: "demo-vapi-assistant",
  status: "active"
};

export const sampleLeads = [
  {
    id: "21111111-1111-4111-8111-111111111111",
    name: "Pradeep Sharma",
    phone: "+91 98765 43210",
    source: "meta",
    status: "qualified",
    budgetMinLakh: 75,
    budgetMaxLakh: 90,
    location: "Kondapur",
    timeline: "Within 2-3 months",
    propertyType: "2BHK or 3BHK",
    notes: "Looking for gated community near workplace. Interested in amenities.",
    intentScore: 88,
    preferredLanguage: "te",
    nextAction: "Book site visit",
    createdAt: "2026-07-20T05:05:00.000Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Arjun Reddy",
    phone: "+91 91234 56789",
    source: "google",
    status: "follow_up",
    budgetMinLakh: 100,
    budgetMaxLakh: 125,
    location: "Gachibowli",
    timeline: "This month",
    propertyType: "3BHK",
    notes: "Asked for price sheet and possession details.",
    intentScore: 81,
    preferredLanguage: "te",
    nextAction: "Call back at 4 PM",
    createdAt: "2026-07-20T04:58:00.000Z"
  },
  {
    id: "23333333-3333-4333-8333-333333333333",
    name: "Neha Verma",
    phone: "+91 99887 66554",
    source: "meta",
    status: "site_visit",
    budgetMinLakh: 60,
    budgetMaxLakh: 80,
    location: "Miyapur",
    timeline: "Ready to visit",
    propertyType: "2BHK",
    notes: "Booked for tomorrow afternoon.",
    intentScore: 92,
    preferredLanguage: "hi",
    nextAction: "Site visit tomorrow",
    createdAt: "2026-07-20T04:50:00.000Z"
  },
  {
    id: "24444444-4444-4444-8444-444444444444",
    name: "Rakesh Kumar",
    phone: "+91 93939 12121",
    source: "manual",
    status: "new",
    budgetMinLakh: 50,
    budgetMaxLakh: 70,
    location: "Kompally",
    timeline: "Exploring",
    propertyType: "2BHK",
    notes: "Needs first call.",
    intentScore: 54,
    preferredLanguage: "hi",
    nextAction: "Call now",
    createdAt: "2026-07-20T04:45:00.000Z"
  }
];

export const sampleCalls = [
  {
    id: "31111111-1111-4111-8111-111111111111",
    leadId: sampleLeads[0].id,
    callerNumber: sampleLeads[0].phone,
    detectedLanguage: "te",
    transcript: [
      { role: "AI Agent", text: "Namaste, Hyderabad Prime Realty nundi maatladutunnanu. Mee budget entha untundi?", timestampMs: 0 },
      { role: "Pradeep", text: "Na budget 75 nundi 90 lakhs madhya undi.", timestampMs: 17000 },
      { role: "AI Agent", text: "Kondapur or Gachibowli side kavala?", timestampMs: 31000 },
      { role: "Pradeep", text: "Kondapur side prefer chestanu.", timestampMs: 44000 }
    ],
    durationSec: 228,
    status: "completed",
    engine: "mock",
    externalCallId: "mock-call-pradeep",
    outcome: "Qualified - site visit",
    summary: "Budget 75L-90L, Kondapur, within 2-3 months, wants gated community.",
    startedAt: "2026-07-20T05:05:00.000Z",
    endedAt: "2026-07-20T05:09:00.000Z"
  },
  {
    id: "32222222-2222-4222-8222-222222222222",
    leadId: sampleLeads[1].id,
    callerNumber: sampleLeads[1].phone,
    detectedLanguage: "te",
    transcript: [],
    durationSec: 96,
    status: "completed",
    engine: "mock",
    externalCallId: "mock-call-arjun",
    outcome: "Needs follow-up",
    summary: "Asked for price sheet and possession date. Callback scheduled.",
    startedAt: "2026-07-20T04:58:00.000Z",
    endedAt: "2026-07-20T05:00:00.000Z"
  }
];

export const sampleAppointments = [
  {
    id: "41111111-1111-4111-8111-111111111111",
    leadId: sampleLeads[0].id,
    scheduledFor: "2026-07-21T05:30:00.000Z",
    status: "booked",
    purpose: "Site visit",
    location: "Kondapur project office",
    notes: "Sales executive to share brochure before visit."
  },
  {
    id: "42222222-2222-4222-8222-222222222222",
    leadId: sampleLeads[2].id,
    scheduledFor: "2026-07-21T09:00:00.000Z",
    status: "booked",
    purpose: "Site visit",
    location: "Miyapur model flat",
    notes: "Prefers Hindi follow-up."
  }
];

export const sampleFollowUps = [
  {
    id: "51111111-1111-4111-8111-111111111111",
    leadId: sampleLeads[0].id,
    channel: "whatsapp",
    status: "sent",
    message:
      "Hi Pradeep, thanks for speaking with Hyderabad Prime Realty. We noted your 75L-90L budget for Kondapur. Your site visit is booked for tomorrow at 11 AM.",
    sentAt: "2026-07-20T05:10:00.000Z"
  }
];

export function sampleDashboard() {
  return {
    agent: sampleAgent,
    metrics: {
      hotLeads: 32,
      siteVisits: 8,
      callsToday: 86,
      needsFollowUp: 26,
      contactedRate: 74,
      qualifiedRate: 31
    },
    leads: sampleLeads,
    calls: sampleCalls,
    appointments: sampleAppointments,
    followUps: sampleFollowUps
  };
}

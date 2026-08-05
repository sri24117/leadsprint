const { PrismaClient } = require("@prisma/client");
const { randomBytes, pbkdf2Sync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const iterations = 120000;
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "hyderabad-prime-realty" },
    update: {
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      bolnaWebhookUrl: `${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/webhooks/bolna`
    },
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Hyderabad Prime Realty",
      slug: "hyderabad-prime-realty",
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      bolnaWebhookUrl: `${(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/webhooks/bolna`
    }
  });

  await prisma.appUser.upsert({
    where: { email: "admin@leadsprint.local" },
    update: {},
    create: {
      workspaceId: workspace.id,
      email: "admin@leadsprint.local",
      name: "Pilot Admin",
      passwordHash: hashPassword("LeadSprint@123"),
      role: "owner"
    }
  });

  await prisma.subscription.upsert({
    where: { id: "00000000-0000-4000-8000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000101",
      workspaceId: workspace.id,
      status: "trial",
      planName: "India Pilot",
      monthlyPricePaise: 999900,
      includedMinutes: 250
    }
  });

  const agent = await prisma.voiceAgent.upsert({
    where: { id: "11111111-1111-4111-8111-111111111111" },
    update: { workspaceId: workspace.id },
    create: {
      id: "11111111-1111-4111-8111-111111111111",
      workspaceId: workspace.id,
      companyName: "Hyderabad Prime Realty",
      businessPrompt:
        "You are the AI caller for Hyderabad Prime Realty. Call new real estate leads quickly, speak Telugu/Hindi/English, qualify budget, location, and timeline, then book a site visit or hand off to sales.",
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
    }
  });

  const leads = [
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
      notes: "Looking for gated community near workplace.",
      intentScore: 88,
      preferredLanguage: "te",
      nextAction: "Book site visit"
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
      nextAction: "Call back at 4 PM"
    }
  ];

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: lead.id },
      update: {},
      create: { ...lead, agentId: agent.id }
    });
  }

  await prisma.callLog.upsert({
    where: { id: "31111111-1111-4111-8111-111111111111" },
    update: {},
    create: {
      id: "31111111-1111-4111-8111-111111111111",
      agentId: agent.id,
      leadId: "21111111-1111-4111-8111-111111111111",
      callerNumber: "+91 98765 43210",
      detectedLanguage: "te",
      transcript: [
        { role: "AI Agent", text: "Namaste, Hyderabad Prime Realty nundi maatladutunnanu.", timestampMs: 0 },
        { role: "Pradeep", text: "Na budget 75 nundi 90 lakhs madhya undi.", timestampMs: 17000 }
      ],
      durationSec: 228,
      status: "completed",
      engine: "mock",
      externalCallId: "mock-call-pradeep",
      outcome: "Qualified - site visit",
      summary: "Budget 75L-90L, Kondapur, within 2-3 months.",
      endedAt: new Date()
    }
  });

  console.log("Seeded LeadSprint production demo data.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

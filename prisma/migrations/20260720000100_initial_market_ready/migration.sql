CREATE TYPE "AgentStatus" AS ENUM ('draft', 'active', 'paused', 'failed');
CREATE TYPE "VoiceProfile" AS ENUM ('male', 'female', 'multilingual');
CREATE TYPE "VoiceEngine" AS ENUM ('mock', 'vapi', 'bolna');
CREATE TYPE "LeadSource" AS ENUM ('meta', 'google', 'website', 'referral', 'manual');
CREATE TYPE "LeadStatus" AS ENUM ('new', 'calling', 'qualified', 'site_visit', 'follow_up', 'closed', 'lost');
CREATE TYPE "AppointmentStatus" AS ENUM ('proposed', 'booked', 'completed', 'cancelled', 'no_show');
CREATE TYPE "FollowUpStatus" AS ENUM ('draft', 'queued', 'sent', 'failed');

CREATE TABLE "VoiceAgent" (
  "id" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "businessPrompt" TEXT NOT NULL,
  "languages" TEXT[] NOT NULL,
  "voiceProfile" "VoiceProfile" NOT NULL DEFAULT 'multilingual',
  "phoneNumber" TEXT,
  "defaultEngine" "VoiceEngine" NOT NULL DEFAULT 'mock',
  "bolnaAgentId" TEXT,
  "vapiAssistantId" TEXT,
  "status" "AgentStatus" NOT NULL DEFAULT 'draft',
  "lastSyncError" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VoiceAgent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallLog" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "leadId" TEXT,
  "callerNumber" TEXT,
  "detectedLanguage" TEXT,
  "transcript" JSONB,
  "durationSec" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'in_progress',
  "engine" "VoiceEngine" NOT NULL DEFAULT 'mock',
  "externalCallId" TEXT,
  "summary" TEXT,
  "outcome" TEXT,
  "recordingUrl" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "source" "LeadSource" NOT NULL DEFAULT 'manual',
  "status" "LeadStatus" NOT NULL DEFAULT 'new',
  "budgetMinLakh" INTEGER,
  "budgetMaxLakh" INTEGER,
  "location" TEXT,
  "timeline" TEXT,
  "propertyType" TEXT,
  "notes" TEXT,
  "intentScore" INTEGER NOT NULL DEFAULT 50,
  "preferredLanguage" TEXT NOT NULL DEFAULT 'te',
  "nextAction" TEXT NOT NULL DEFAULT 'Call now',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'booked',
  "purpose" TEXT NOT NULL DEFAULT 'Site visit',
  "location" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FollowUp" (
  "id" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'whatsapp',
  "message" TEXT NOT NULL,
  "status" "FollowUpStatus" NOT NULL DEFAULT 'draft',
  "scheduledFor" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceAgent_phoneNumber_key" ON "VoiceAgent"("phoneNumber");
CREATE UNIQUE INDEX "VoiceAgent_bolnaAgentId_key" ON "VoiceAgent"("bolnaAgentId");
CREATE UNIQUE INDEX "VoiceAgent_vapiAssistantId_key" ON "VoiceAgent"("vapiAssistantId");
CREATE INDEX "VoiceAgent_status_idx" ON "VoiceAgent"("status");
CREATE INDEX "CallLog_agentId_idx" ON "CallLog"("agentId");
CREATE INDEX "CallLog_leadId_idx" ON "CallLog"("leadId");
CREATE INDEX "CallLog_engine_idx" ON "CallLog"("engine");
CREATE INDEX "CallLog_externalCallId_idx" ON "CallLog"("externalCallId");
CREATE INDEX "CallLog_startedAt_idx" ON "CallLog"("startedAt");
CREATE INDEX "Lead_agentId_idx" ON "Lead"("agentId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_intentScore_idx" ON "Lead"("intentScore");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Appointment_agentId_idx" ON "Appointment"("agentId");
CREATE INDEX "Appointment_leadId_idx" ON "Appointment"("leadId");
CREATE INDEX "Appointment_scheduledFor_idx" ON "Appointment"("scheduledFor");
CREATE INDEX "FollowUp_agentId_idx" ON "FollowUp"("agentId");
CREATE INDEX "FollowUp_leadId_idx" ON "FollowUp"("leadId");
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "VoiceAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "VoiceAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "VoiceAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "VoiceAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

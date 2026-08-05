CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'member');
CREATE TYPE "SubscriptionStatus" AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'disabled');

CREATE TABLE "Workspace" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'IN',
  "vertical" TEXT NOT NULL DEFAULT 'real-estate',
  "publicAppUrl" TEXT,
  "verifiedCallingNumber" TEXT,
  "bolnaWebhookUrl" TEXT,
  "recordingConsentRequired" BOOLEAN NOT NULL DEFAULT true,
  "consentDisclaimer" TEXT NOT NULL DEFAULT 'This call may be recorded and handled by an AI assistant for lead qualification and service quality.',
  "retentionDays" INTEGER NOT NULL DEFAULT 180,
  "status" TEXT NOT NULL DEFAULT 'pilot',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppUser" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'owner',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
  "planName" TEXT NOT NULL DEFAULT 'Pilot',
  "monthlyPricePaise" INTEGER NOT NULL DEFAULT 999900,
  "includedMinutes" INTEGER NOT NULL DEFAULT 250,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "currentPeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "level" TEXT NOT NULL DEFAULT 'info',
  "source" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");
CREATE INDEX "Workspace_status_idx" ON "Workspace"("status");
CREATE INDEX "AppUser_workspaceId_idx" ON "AppUser"("workspaceId");
CREATE INDEX "Subscription_workspaceId_idx" ON "Subscription"("workspaceId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "AuditEvent_workspaceId_idx" ON "AuditEvent"("workspaceId");
CREATE INDEX "AuditEvent_level_idx" ON "AuditEvent"("level");
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

INSERT INTO "Workspace" (
  "id",
  "name",
  "slug",
  "publicAppUrl",
  "bolnaWebhookUrl",
  "createdAt",
  "updatedAt"
) VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Hyderabad Prime Realty',
  'hyderabad-prime-realty',
  'http://localhost:3000',
  'http://localhost:3000/api/webhooks/bolna',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Subscription" (
  "id",
  "workspaceId",
  "status",
  "planName",
  "monthlyPricePaise",
  "includedMinutes",
  "createdAt",
  "updatedAt"
) VALUES (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  'trial',
  'India Pilot',
  999900,
  250,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "VoiceAgent" ADD COLUMN "workspaceId" TEXT;
UPDATE "VoiceAgent" SET "workspaceId" = '00000000-0000-4000-8000-000000000001' WHERE "workspaceId" IS NULL;
ALTER TABLE "VoiceAgent" ALTER COLUMN "workspaceId" SET NOT NULL;

CREATE INDEX "VoiceAgent_workspaceId_idx" ON "VoiceAgent"("workspaceId");

ALTER TABLE "AppUser" ADD CONSTRAINT "AppUser_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceAgent" ADD CONSTRAINT "VoiceAgent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

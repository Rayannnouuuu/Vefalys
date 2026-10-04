-- AlterTable
ALTER TABLE "Facture" ADD COLUMN "attachmentPath" TEXT;
ALTER TABLE "Facture" ADD COLUMN "reference" TEXT;

-- CreateTable
CREATE TABLE "CalendlyIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "calendlyUserUri" TEXT NOT NULL,
    "calendlyUserName" TEXT,
    "calendlyUserEmail" TEXT,
    "organizationUri" TEXT,
    "webhookSubscriptionUri" TEXT,
    "connectedById" TEXT,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendlyIntegration_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RDV_PHYSIQUE',
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "contactId" TEXT,
    "opportunityId" TEXT,
    "createdById" TEXT,
    "reminderMinutesBefore" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calendlyEventUri" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUEL',
    CONSTRAINT "Appointment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("contactId", "createdAt", "createdById", "description", "endAt", "id", "location", "opportunityId", "reminderMinutesBefore", "startAt", "title", "type") SELECT "contactId", "createdAt", "createdById", "description", "endAt", "id", "location", "opportunityId", "reminderMinutesBefore", "startAt", "title", "type" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
CREATE UNIQUE INDEX "Appointment_calendlyEventUri_key" ON "Appointment"("calendlyEventUri");
CREATE INDEX "Appointment_startAt_idx" ON "Appointment"("startAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

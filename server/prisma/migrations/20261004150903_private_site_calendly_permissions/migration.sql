/*
  Warnings:

  - Made the column `connectedById` on table `CalendlyIntegration` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CalendlyIntegration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "calendlyUserUri" TEXT NOT NULL,
    "calendlyUserName" TEXT,
    "calendlyUserEmail" TEXT,
    "organizationUri" TEXT,
    "webhookSubscriptionUri" TEXT,
    "signingKey" TEXT,
    "connectedById" TEXT NOT NULL,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendlyIntegration_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CalendlyIntegration" ("accessToken", "calendlyUserEmail", "calendlyUserName", "calendlyUserUri", "connectedById", "createdAt", "id", "lastSyncAt", "organizationUri", "signingKey", "webhookSubscriptionUri") SELECT "accessToken", "calendlyUserEmail", "calendlyUserName", "calendlyUserUri", "connectedById", "createdAt", "id", "lastSyncAt", "organizationUri", "signingKey", "webhookSubscriptionUri" FROM "CalendlyIntegration";
DROP TABLE "CalendlyIntegration";
ALTER TABLE "new_CalendlyIntegration" RENAME TO "CalendlyIntegration";
CREATE UNIQUE INDEX "CalendlyIntegration_connectedById_key" ON "CalendlyIntegration"("connectedById");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COLLABORATEUR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "avatarColor" TEXT NOT NULL DEFAULT '#2563eb',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT true,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" DATETIME,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "approvedById" TEXT,
    "approvedAt" DATETIME,
    "rejectedReason" TEXT,
    CONSTRAINT "User_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarColor", "createdAt", "email", "firstName", "id", "isActive", "lastName", "passwordHash", "role", "updatedAt") SELECT "avatarColor", "createdAt", "email", "firstName", "id", "isActive", "lastName", "passwordHash", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_emailVerificationToken_key" ON "User"("emailVerificationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

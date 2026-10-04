-- AlterTable
ALTER TABLE "Facture" ADD COLUMN "promoterName" TEXT;

-- CreateTable
CREATE TABLE "ProspectDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    CONSTRAINT "ProspectDocument_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProspectDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "userId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "sector" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROSPECT_FROID',
    "source" TEXT NOT NULL DEFAULT 'AUTRE',
    "notes" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "budgetMin" REAL,
    "budgetMax" REAL,
    "typologieRecherchee" TEXT,
    "localisationSouhaitee" TEXT,
    "financement" TEXT,
    "criteresNotes" TEXT,
    "mandatSigned" BOOLEAN NOT NULL DEFAULT false,
    "mandatSignedDate" DATETIME,
    "financingProofUploaded" BOOLEAN NOT NULL DEFAULT false,
    "financingProofDate" DATETIME,
    "ownerId" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("archivedAt", "budgetMax", "budgetMin", "company", "createdAt", "criteresNotes", "email", "financement", "firstName", "id", "lastName", "localisationSouhaitee", "location", "notes", "ownerId", "phone", "score", "sector", "source", "status", "typologieRecherchee", "updatedAt") SELECT "archivedAt", "budgetMax", "budgetMin", "company", "createdAt", "criteresNotes", "email", "financement", "firstName", "id", "lastName", "localisationSouhaitee", "location", "notes", "ownerId", "phone", "score", "sector", "source", "status", "typologieRecherchee", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_status_idx" ON "Contact"("status");
CREATE INDEX "Contact_lastName_firstName_idx" ON "Contact"("lastName", "firstName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ProspectDocument_contactId_idx" ON "ProspectDocument"("contactId");

-- CreateIndex
CREATE INDEX "Comment_contactId_idx" ON "Comment"("contactId");

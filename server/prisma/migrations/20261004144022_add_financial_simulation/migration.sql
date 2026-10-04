-- CreateTable
CREATE TABLE "FinancialSimulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT,
    "label" TEXT,
    "objectif" TEXT NOT NULL DEFAULT 'PRINCIPALE',
    "typeBien" TEXT NOT NULL DEFAULT 'APPARTEMENT_NEUF',
    "primoAccedant" BOOLEAN NOT NULL DEFAULT true,
    "revenusMensuels" REAL NOT NULL,
    "chargesMensuelles" REAL NOT NULL DEFAULT 0,
    "apport" REAL NOT NULL DEFAULT 0,
    "dureeAnnees" INTEGER NOT NULL DEFAULT 20,
    "tauxPersonnalise" REAL,
    "personnesFoyer" INTEGER NOT NULL DEFAULT 1,
    "zone" TEXT NOT NULL DEFAULT 'A',
    "revenuFiscalReference" REAL,
    "prixBienVise" REAL,
    "tauxApplique" REAL NOT NULL,
    "mensualiteMax" REAL NOT NULL,
    "capaciteEmprunt" REAL NOT NULL,
    "fraisNotaire" REAL NOT NULL,
    "coutInterets" REAL NOT NULL,
    "tauxEndettement" REAL NOT NULL,
    "budgetFinancable" REAL NOT NULL,
    "ptzEligible" BOOLEAN NOT NULL DEFAULT false,
    "ptzMontant" REAL,
    "ptzMotifInegibilite" TEXT,
    "budgetTotalAvecPtz" REAL,
    "cibleMensualite" REAL,
    "cibleMargeMensuelle" REAL,
    "cibleApportSupplementaire" REAL,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialSimulation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FinancialSimulation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FinancialSimulation_contactId_idx" ON "FinancialSimulation"("contactId");

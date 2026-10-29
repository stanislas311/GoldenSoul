-- CreateEnum
CREATE TYPE "StatutSession" AS ENUM ('EN_ATTENTE_PAIEMENT', 'EN_ATTENTE_CONFIRMATION', 'CONFIRMEE', 'TERMINEE', 'ANNULEE', 'ABSENCE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'PAYE', 'ECHOUE', 'REMBOURSE', 'REMBOURSEMENT_EN_COURS');

-- CreateTable
CREATE TABLE "availabilities" (
    "id" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "reserve" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "availabilityId" TEXT NOT NULL,
    "statut" "StatutSession" NOT NULL DEFAULT 'EN_ATTENTE_PAIEMENT',
    "optionSecurite" BOOLEAN NOT NULL DEFAULT false,
    "lienVisio" TEXT,
    "noteClinique" TEXT,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "confirmeLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "montant" INTEGER NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "referenceExterne" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "availabilities_dateDebut_key" ON "availabilities"("dateDebut");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_availabilityId_key" ON "sessions"("availabilityId");

-- CreateIndex
CREATE INDEX "sessions_patientId_idx" ON "sessions"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_sessionId_key" ON "payments"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "avis_sessionId_key" ON "avis"("sessionId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "availabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

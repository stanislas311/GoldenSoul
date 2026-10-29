-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'PRATICIEN');

-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('HOMME', 'FEMME', 'AUTRE');

-- CreateEnum
CREATE TYPE "SituationMatrimoniale" AS ENUM ('CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('FR', 'EN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PATIENT',
    "telephone" TEXT,
    "genre" "Genre",
    "dateNaissance" TIMESTAMP(3),
    "situationMatrimoniale" "SituationMatrimoniale",
    "bio" TEXT,
    "photoUrl" TEXT,
    "languePreferee" "Langue" NOT NULL DEFAULT 'FR',
    "consentementAccepte" BOOLEAN NOT NULL DEFAULT false,
    "consentementDate" TIMESTAMP(3),
    "consentementVersion" TEXT,
    "accepteAnnonces" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

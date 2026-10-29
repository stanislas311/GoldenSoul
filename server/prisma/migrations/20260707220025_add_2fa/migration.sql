-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorActif" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

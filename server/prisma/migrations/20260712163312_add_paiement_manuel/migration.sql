/*
  Warnings:

  - A unique constraint covering the columns `[codeReference]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "codeReference" TEXT,
ADD COLUMN     "preuveUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "numeroPaiement" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payments_codeReference_key" ON "payments"("codeReference");

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "praticienId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_patientId_idx" ON "audit_logs"("patientId");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_praticienId_fkey" FOREIGN KEY ("praticienId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

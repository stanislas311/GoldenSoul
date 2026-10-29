-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "dureeVocal" INTEGER,
ADD COLUMN     "fichierNom" TEXT,
ADD COLUMN     "fichierTaille" INTEGER,
ADD COLUMN     "fichierUrl" TEXT,
ADD COLUMN     "messageIdReponse" TEXT,
ADD COLUMN     "modifie" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "modifieLe" TIMESTAMP(3),
ADD COLUMN     "supprime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supprimeLe" TIMESTAMP(3),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'TEXTE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "contenu" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "messages_messageIdReponse_idx" ON "messages"("messageIdReponse");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_messageIdReponse_fkey" FOREIGN KEY ("messageIdReponse") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

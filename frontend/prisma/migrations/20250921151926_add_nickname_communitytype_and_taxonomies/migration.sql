-- AlterTable
ALTER TABLE "public"."Persona" ADD COLUMN     "communityTypeId" UUID,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Persona_communityTypeId_idx" ON "public"."Persona"("communityTypeId");

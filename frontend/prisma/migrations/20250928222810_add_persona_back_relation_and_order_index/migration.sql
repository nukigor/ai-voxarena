-- CreateTable
CREATE TABLE "public"."Debate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT NOT NULL DEFAULT 'structured',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DebateParticipant" (
    "id" TEXT NOT NULL,
    "debateId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "displayName" TEXT,
    "voiceId" TEXT,
    "meta" JSONB,

    CONSTRAINT "DebateParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DebateParticipant_debateId_idx" ON "public"."DebateParticipant"("debateId");

-- CreateIndex
CREATE INDEX "DebateParticipant_personaId_idx" ON "public"."DebateParticipant"("personaId");

-- CreateIndex
CREATE INDEX "DebateParticipant_debateId_orderIndex_idx" ON "public"."DebateParticipant"("debateId", "orderIndex");

-- AddForeignKey
ALTER TABLE "public"."DebateParticipant" ADD CONSTRAINT "DebateParticipant_debateId_fkey" FOREIGN KEY ("debateId") REFERENCES "public"."Debate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DebateParticipant" ADD CONSTRAINT "DebateParticipant_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

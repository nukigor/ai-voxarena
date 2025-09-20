-- CreateTable
CREATE TABLE "public"."Persona" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ageGroup" TEXT,
    "genderIdentity" TEXT,
    "pronouns" TEXT,
    "profession" TEXT,
    "temperament" TEXT,
    "confidence" INTEGER,
    "verbosity" TEXT,
    "tone" TEXT,
    "accentNote" TEXT,
    "quirks" TEXT[],
    "vocabularyStyle" TEXT,
    "debateApproach" TEXT[],
    "conflictStyle" TEXT,
    "voiceProvider" TEXT,
    "voiceStyle" JSONB,
    "emotionMap" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "universityId" UUID,
    "organizationId" UUID,
    "cultureId" UUID,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Taxonomy" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "slug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonaTaxonomy" (
    "personaId" TEXT NOT NULL,
    "taxonomyId" TEXT NOT NULL,

    CONSTRAINT "PersonaTaxonomy_pkey" PRIMARY KEY ("personaId","taxonomyId")
);

-- CreateIndex
CREATE INDEX "Persona_universityId_idx" ON "public"."Persona"("universityId");

-- CreateIndex
CREATE INDEX "Persona_organizationId_idx" ON "public"."Persona"("organizationId");

-- CreateIndex
CREATE INDEX "Persona_cultureId_idx" ON "public"."Persona"("cultureId");

-- CreateIndex
CREATE INDEX "Taxonomy_category_idx" ON "public"."Taxonomy"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Taxonomy_category_term_key" ON "public"."Taxonomy"("category", "term");

-- CreateIndex
CREATE INDEX "PersonaTaxonomy_taxonomyId_idx" ON "public"."PersonaTaxonomy"("taxonomyId");

-- AddForeignKey
ALTER TABLE "public"."PersonaTaxonomy" ADD CONSTRAINT "PersonaTaxonomy_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "public"."Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonaTaxonomy" ADD CONSTRAINT "PersonaTaxonomy_taxonomyId_fkey" FOREIGN KEY ("taxonomyId") REFERENCES "public"."Taxonomy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

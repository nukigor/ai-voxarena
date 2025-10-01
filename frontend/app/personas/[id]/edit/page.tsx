import { prisma } from "@/lib/prisma";
import PersonaWizard from "@/components/persona/PersonaWizard";
import PageHeader from "@/components/layout/PageHeader";
import { notFound } from "next/navigation";

function groupTaxo(persona: any) {
  const byCat: Record<string, string[]> = {};
  for (const link of persona.taxonomies ?? []) {
    const cat = link.taxonomy?.category;
    const id = link.taxonomyId;
    if (!cat || !id) continue;
    (byCat[cat] ||= []).push(id);
  }
  const first = (c: string) => (byCat[c]?.[0] ?? null);

  return {
    universityId: first("university"),
    organizationId: first("organization"),

    // NOTE: Region is stored in the wizard under `cultureId` (legacy key).
    // The taxonomy category for Region is "region", so we map that here.
    cultureId: first("region"),

    // Culture is a multi-select; the wizard reads `cultureIds` for this.
    cultureIds: byCat["culture"] ?? [],

    communityTypeId: first("communityType"),
    politicalId: first("political"),
    religionId: first("religion"),
    accentId: first("accent"),
    archetypeIds: byCat["archetype"] ?? [],
    philosophyIds: byCat["philosophy"] ?? [],
    fillerPhraseIds: byCat["fillerPhrase"] ?? [],
    metaphorIds: byCat["metaphor"] ?? [],
    debateHabitIds: byCat["debateHabit"] ?? [],
  };
}

export default async function EditPersonaPage({ params }: { params: { id: string } }) {
  const persona = await prisma.persona.findUnique({
    where: { id: params.id },
    include: { taxonomies: { include: { taxonomy: true } } },
  });
  if (!persona) notFound();

  const tax = groupTaxo(persona);

  const initialData = {
    id: persona.id,
    name: persona.name ?? "",
    nickname: persona.nickname ?? "",
    ageGroup: persona.ageGroup ?? null,
    genderIdentity: persona.genderIdentity ?? null,
    pronouns: persona.pronouns ?? "",
    profession: persona.profession ?? "",
    temperament: persona.temperament ?? null,
    confidence: persona.confidence ?? 5,
    verbosity: persona.verbosity ?? 5,
    tone: persona.tone ?? null,
    vocabularyStyle: persona.vocabularyStyle ?? null,
    conflictStyle: persona.conflictStyle ?? null,
    debateApproach: persona.debateApproach ?? [],
    accentNote: persona.accentNote ?? "",
    quirksText: Array.isArray(persona.quirks) ? (persona.quirks[0] ?? "") : "",
    ...tax,
  };

  return (
    <>
      <PageHeader title="Edit Persona" />
      <PersonaWizard mode="edit" personaId={persona.id} initialData={initialData} />
    </>
  );
}
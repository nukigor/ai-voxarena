// app/personas/[id]/edit/page.tsx
import { prisma } from "@/lib/prisma";
import PersonaWizard from "@/components/persona/PersonaWizard";

function groupTaxo(persona: any) {
  // Convert PersonaTaxonomy[] to lookup by category
  const byCat: Record<string, string[]> = {};
  for (const link of persona.taxonomies ?? []) {
    const cat = link.taxonomy?.category;
    const id = link.taxonomyId;
    if (!cat || !id) continue;
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(id);
  }
  const first = (cat: string) => (byCat[cat]?.[0] ?? null);

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

  if (!persona) {
    // You can render a 404 or redirect
    return <div className="p-6">Persona not found.</div>;
  }

  const tax = groupTaxo(persona);

  const initialData = {
    // Scalars
    name: persona.name ?? "",
    nickname: persona.nickname ?? "",
    ageGroup: persona.ageGroup ?? null,
    genderIdentity: persona.genderIdentity ?? null,
    pronouns: persona.pronouns ?? "",
    profession: persona.profession ?? "",
    temperament: persona.temperament ?? null,
    confidence: typeof persona.confidence === "number" ? persona.confidence : 5,
    verbosity: typeof persona.verbosity === "number" ? persona.verbosity : 5,
    tone: persona.tone ?? null,
    vocabularyStyle: persona.vocabularyStyle ?? null,
    conflictStyle: persona.conflictStyle ?? null,
    debateApproach: Array.isArray(persona.debateApproach) ? persona.debateApproach : [],
    accentNote: persona.accentNote ?? "",
    quirksText: Array.isArray(persona.quirks) ? (persona.quirks[0] ?? "") : "",
    // Taxonomy-derived fields
    ...tax,
  };

  return <PersonaWizard initialData={initialData} />;
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      include: { taxonomies: { include: { taxonomy: true } } },
    });
    return NextResponse.json(personas);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to fetch personas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ---- Scalars from spec (identity, culture/personality, debate/communication, quirks)
    const {
      name,
      nickname,
      ageGroup,           // SingleSelect (personaOptions)
      genderIdentity,     // SingleSelect (personaOptions)
      pronouns,

      // Education & org
      profession,         // free text

      // Personality / culture & beliefs
      temperament,        // SingleSelect (personaOptions)
      confidence,         // 1..10 slider
      // taxonomies (single)
      cultureId,
      communityTypeId,
      politicalId,
      religionId,

      // Debate / communication
      debateApproach,     // string[] (MultiSelect, personaOptions)
      conflictStyle,      // string (SingleSelect)
      vocabularyStyle,    // string (SingleSelect)
      verbosity,          // 1..10 slider (number)
      tone,               // string (SingleSelect)
      accentId,           // taxonomy id (store link)
      accentNote,         // keep the selected term for convenience (optional label)

      // Quirks & habits
      quirksText,         // free text shown as a single-item array in Persona.quirks

      // Taxonomies (multi)
      archetypeIds = [],
      philosophyIds = [],
      fillerPhraseIds = [],
      metaphorIds = [],
      debateHabitIds = [],

      // Taxonomies (single)
      universityId,
      organizationId,
    } = body ?? {};

    // ---- Build scalar payload (strip undefined)
    const scalarData = clean({
      name,
      nickname,
      ageGroup,               // scalar string per spec
      genderIdentity,         // scalar string per spec
      pronouns,

      profession,

      temperament,
      confidence: typeof confidence === "number" ? confidence : undefined,
      verbosity: typeof verbosity === "number" ? verbosity : undefined,
      tone,
      vocabularyStyle,
      conflictStyle,
      debateApproach: Array.isArray(debateApproach) ? debateApproach : undefined,

      accentNote: typeof accentNote === "string" ? accentNote : undefined,

      // store quirks as text[]
      quirks:
        typeof quirksText === "string" && quirksText.trim()
          ? [quirksText.trim()]
          : undefined,
    });

    // ---- Collect taxonomy links (multi + single + accent)
    const taxoIds: string[] = [
      ...archetypeIds,
      ...philosophyIds,
      ...fillerPhraseIds,
      ...metaphorIds,
      ...debateHabitIds,
    ];
    if (universityId) taxoIds.push(universityId);
    if (organizationId) taxoIds.push(organizationId);
    if (cultureId) taxoIds.push(cultureId);
    if (communityTypeId) taxoIds.push(communityTypeId);
    if (politicalId) taxoIds.push(politicalId);
    if (religionId) taxoIds.push(religionId);
    if (accentId) taxoIds.push(accentId); // ✅ record accent taxonomy selection

    const persona = await prisma.persona.create({
      data: {
        ...scalarData,
        taxonomies: {
          create: taxoIds.map((taxonomyId) => ({ taxonomyId })),
        },
      },
      include: { taxonomies: { include: { taxonomy: true } } },
    });

    return NextResponse.json(persona, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/personas failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create persona" }, { status: 500 });
  }
}
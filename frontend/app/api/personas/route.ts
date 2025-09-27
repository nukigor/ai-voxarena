import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// remove undefined values (Prisma rejects undefined)
function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      include: { taxonomies: { include: { taxonomy: true } } },
    });
    return NextResponse.json(personas);
  } catch (err) {
    console.error("❌ GET /api/personas failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch personas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      // safe scalars (Persona table)
      name,
      nickname,
      age,
      pronouns,
      profession,
      confidence,
      accentNote,
      quirksText,

      // taxonomy selections
      universityId,
      organizationId,
      cultureId,
      communityTypeId,
      politicalId,
      religionId,
      archetypeIds = [],
      philosophyIds = [],
      fillerPhraseIds = [],
      metaphorIds = [],
      debateHabitIds = [],
    } = body ?? {};

    // build scalar data & strip undefined
    const scalarData = clean({
      name,
      nickname,
      age: typeof age === "number" ? age : undefined,
      pronouns,
      profession,
      confidence,
      accentNote,
      quirks:
        typeof quirksText === "string" && quirksText.trim()
          ? [quirksText.trim()]
          : undefined,
    });

    // collect taxonomy IDs
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
    return NextResponse.json(
      { error: err?.message ?? "Failed to create persona" },
      { status: 500 }
    );
  }
}
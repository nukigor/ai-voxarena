import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ------------------------------- GET ------------------------------- */
// GET /api/personas
export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        taxonomies: {
          include: { taxonomy: true },
        },
      },
    });
    return NextResponse.json(personas);
  } catch (err: any) {
    console.error("GET /api/personas failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch personas" },
      { status: 500 }
    );
  }
}

/* ------------------------------- POST ------------------------------- */
// POST /api/personas
// Creates a new persona with scalar fields and taxonomy links
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      // identity
      name,
      nickname,
      ageGroup,
      gender,
      pronouns,

      // work/edu
      universityId,
      employerId,
      profession,

      // personality
      archetypeIds = [],
      temperament,
      confidence,

      // culture / beliefs
      cultureId,        // Region (single)
      cultureIds = [],  // ✅ NEW: Culture (multi)
      communityTypeId,
      politicalId,
      religionId,
      philosophyIds = [],

      // comms
      approach = [],
      conflictStyle,
      vocabulary,
      verbosity,
      tone,
      accentId,

      // quirks/habits
      quirks,
      fillerPhraseIds = [],
      metaphorIds = [],
      debateHabitIds = [],
    } = body;

    // Collect taxonomy IDs
    const taxoIds: string[] = [
      ...archetypeIds,
      ...philosophyIds,
      ...fillerPhraseIds,
      ...metaphorIds,
      ...debateHabitIds,
      ...cultureIds, // ✅ add multi Culture
    ];
    if (cultureId) taxoIds.push(cultureId); // Region
    if (communityTypeId) taxoIds.push(communityTypeId);
    if (politicalId) taxoIds.push(politicalId);
    if (religionId) taxoIds.push(religionId);
    if (accentId) taxoIds.push(accentId);
    if (universityId) taxoIds.push(universityId);
    if (employerId) taxoIds.push(employerId);

    const persona = await prisma.persona.create({
      data: {
        name,
        nickname,
        ageGroup,
        gender,
        pronouns,
        universityId,
        employerId,
        profession,
        temperament,
        confidence,
        approach,
        conflictStyle,
        vocabulary,
        verbosity,
        tone,
        quirks,
        taxonomies: {
          connect: taxoIds.map((id) => ({ id })),
        },
      },
      include: {
        taxonomies: {
          include: { taxonomy: true },
        },
      },
    });

    return NextResponse.json(persona, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/personas failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create persona" },
      { status: 500 }
    );
  }
}
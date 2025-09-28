// app/api/personas/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const persona = await prisma.persona.findUnique({
    where: { id: params.id },
    include: { taxonomies: { include: { taxonomy: true } } },
  });
  if (!persona) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(persona);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const {
      // Scalars
      name, nickname, ageGroup, genderIdentity, pronouns, profession,
      temperament, confidence, verbosity, tone, vocabularyStyle, conflictStyle,
      debateApproach, accentNote, quirksText,

      // Taxonomy singles
      universityId, organizationId, cultureId, communityTypeId, politicalId, religionId, accentId,

      // Taxonomy multis
      archetypeIds = [], philosophyIds = [], fillerPhraseIds = [], metaphorIds = [], debateHabitIds = [],
    } = body ?? {};

    const scalarData = clean({
      name, nickname, ageGroup, genderIdentity, pronouns, profession, temperament,
      confidence: typeof confidence === "number" ? confidence : undefined,
      verbosity: typeof verbosity === "number" ? verbosity : undefined,
      tone, vocabularyStyle, conflictStyle,
      debateApproach: Array.isArray(debateApproach) ? debateApproach : undefined,
      accentNote: typeof accentNote === "string" ? accentNote : undefined,
      quirks:
        typeof quirksText === "string"
          ? (quirksText.trim() ? [quirksText.trim()] : [])
          : undefined,
    });

    const taxoIds: string[] = [
      ...archetypeIds, ...philosophyIds, ...fillerPhraseIds, ...metaphorIds, ...debateHabitIds,
    ];
    if (universityId) taxoIds.push(universityId);
    if (organizationId) taxoIds.push(organizationId);
    if (cultureId) taxoIds.push(cultureId);
    if (communityTypeId) taxoIds.push(communityTypeId);
    if (politicalId) taxoIds.push(politicalId);
    if (religionId) taxoIds.push(religionId);
    if (accentId) taxoIds.push(accentId);

    const updated = await prisma.persona.update({
      where: { id },
      data: {
        ...scalarData,
        taxonomies: {
          deleteMany: {},                                   // replace links
          create: taxoIds.map((taxonomyId) => ({ taxonomyId })),
        },
      },
      include: { taxonomies: { include: { taxonomy: true } } },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/personas/[id] failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update persona" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.persona.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to delete persona" }, { status: 500 });
  }
}
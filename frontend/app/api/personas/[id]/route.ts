import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ----------------------------- Helpers ----------------------------- */

function normStr(x: unknown): string | null {
  if (typeof x !== "string") return null;
  const v = x.trim();
  return v.length ? v : null;
}

function normOptStr(x: unknown): string | undefined {
  const v = normStr(x);
  return v === null ? undefined : v;
}

function normInt(x: unknown): number | null {
  if (typeof x === "number" && Number.isFinite(x)) return Math.trunc(x);
  return null;
}

function normStringArray(x: unknown): string[] | null {
  if (!Array.isArray(x)) return null;
  const arr = x
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return arr;
}

// Accept both `quirks` as string[] OR `quirksText` as a delimitered string.
function normalizeQuirks(body: any): string[] | undefined {
  const fromArr = normStringArray(body?.quirks);
  if (fromArr) return fromArr;

  if (typeof body?.quirksText === "string") {
    const parts = body.quirksText
      .split(/\r?\n|,|;|•/g)
      .map((s: string) => s.trim())
      .filter(Boolean);
    return parts;
  }
  return undefined;
}

// Accept taxonomy ids as either `taxonomyIds: string[]` or
// the older shape: { taxonomies: { create: [{ taxonomyId }, ...] } }
function normalizeTaxonomyIds(body: any): string[] | undefined {
  const ids = normStringArray(body?.taxonomyIds);
  if (ids) return ids;

  const legacy = body?.taxonomies?.create;
  if (Array.isArray(legacy)) {
    const legacyIds = legacy
      .map((t: any) => (typeof t?.taxonomyId === "string" ? t.taxonomyId : ""))
      .filter(Boolean);
    return legacyIds.length ? legacyIds : undefined;
  }
  return undefined;
}

/* ------------------------------- GET ------------------------------- */
// GET /api/personas/:id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const persona = await prisma.persona.findUnique({
      where: { id: params.id },
      include: {
        taxonomies: {
          include: { taxonomy: true },
        },
      },
    });
    if (!persona) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(persona);
  } catch (err: any) {
    console.error("GET /api/personas/[id] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to load persona" },
      { status: 500 }
    );
  }
}

/* ------------------------------- PUT ------------------------------- */
// PUT /api/personas/:id
// Updates scalar fields and optionally REPLACES taxonomy links if taxonomyIds is provided.
// Extension: if taxonomyIds is NOT provided but granular taxonomy fields are present,
//            we rebuild the taxonomy links from those fields (including `cultureIds` multi).
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Scalars (only set when provided)
    const data: any = {
      // identity
      name: normOptStr(body?.name),
      nickname: body?.nickname === undefined ? undefined : normStr(body?.nickname),
      ageGroup: body?.ageGroup === undefined ? undefined : normStr(body?.ageGroup),
      genderIdentity:
        body?.genderIdentity === undefined ? undefined : normStr(body?.genderIdentity),
      pronouns: body?.pronouns === undefined ? undefined : normStr(body?.pronouns),

      // work/role
      profession: body?.profession === undefined ? undefined : normStr(body?.profession),

      // personality
      temperament: body?.temperament === undefined ? undefined : normStr(body?.temperament),
      confidence: body?.confidence === undefined ? undefined : normInt(body?.confidence),
      verbosity: body?.verbosity === undefined ? undefined : normInt(body?.verbosity),
      tone: body?.tone === undefined ? undefined : normStr(body?.tone),

      // comms + quirks
      vocabularyStyle:
        body?.vocabularyStyle === undefined ? undefined : normStr(body?.vocabularyStyle),
      conflictStyle:
        body?.conflictStyle === undefined ? undefined : normStr(body?.conflictStyle),
      accentNote: body?.accentNote === undefined ? undefined : normStr(body?.accentNote),

      // arrays
      debateApproach:
        body?.debateApproach === undefined ? undefined : normStringArray(body?.debateApproach),
      emotionMap:
        body?.emotionMap === undefined ? undefined : normStringArray(body?.emotionMap),
      quirks: normalizeQuirks(body),

      // media
      avatarUrl: body?.avatarUrl === undefined ? undefined : normStr(body?.avatarUrl),

      // voice
      voiceProvider:
        body?.voiceProvider === undefined ? undefined : normStr(body?.voiceProvider),
      voiceStyle: body?.voiceStyle === undefined ? undefined : body?.voiceStyle, // JSON (pass-through)
    };

    // Remove keys with value === undefined so Prisma performs partial update cleanly
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // Handle taxonomy replacement if provided
    const taxonomyIds = normalizeTaxonomyIds(body);
    if (taxonomyIds) {
      data.taxonomies = {
        deleteMany: {}, // replace all
        create: taxonomyIds.map((taxonomyId: string) => ({ taxonomyId })),
      };
    } else {
      // --- Rebuild from granular fields if present (adds `cultureIds` multi) ---
      const archetypeIds = Array.isArray(body?.archetypeIds) ? body.archetypeIds : [];
      const philosophyIds = Array.isArray(body?.philosophyIds) ? body.philosophyIds : [];
      const fillerPhraseIds = Array.isArray(body?.fillerPhraseIds) ? body.fillerPhraseIds : [];
      const metaphorIds = Array.isArray(body?.metaphorIds) ? body.metaphorIds : [];
      const debateHabitIds = Array.isArray(body?.debateHabitIds) ? body.debateHabitIds : [];
      const cultureIds = Array.isArray(body?.cultureIds) ? body.cultureIds : []; // ✅ NEW multi

      const taxoIds: string[] = [
        ...archetypeIds,
        ...philosophyIds,
        ...fillerPhraseIds,
        ...metaphorIds,
        ...debateHabitIds,
        ...cultureIds,
      ];

      // Single-selects (push if present)
      if (typeof body?.cultureId === "string" && body.cultureId) taxoIds.push(body.cultureId); // Region (single)
      if (typeof body?.communityTypeId === "string" && body.communityTypeId) taxoIds.push(body.communityTypeId);
      if (typeof body?.politicalId === "string" && body.politicalId) taxoIds.push(body.politicalId);
      if (typeof body?.religionId === "string" && body.religionId) taxoIds.push(body.religionId);
      if (typeof body?.accentId === "string" && body.accentId) taxoIds.push(body.accentId);
      if (typeof body?.universityId === "string" && body.universityId) taxoIds.push(body.universityId);
      if (typeof body?.employerId === "string" && body.employerId) taxoIds.push(body.employerId);

      if (taxoIds.length) {
        data.taxonomies = {
          deleteMany: {}, // replace all
          create: taxoIds.map((taxonomyId: string) => ({ taxonomyId })),
        };
      }
    }

    const updated = await prisma.persona.update({
      where: { id: params.id },
      data,
      include: {
        taxonomies: {
          include: { taxonomy: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/personas/[id] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update persona" },
      { status: 500 }
    );
  }
}

/* ----------------------------- DELETE ------------------------------ */
// DELETE /api/personas/:id
// Prevent deletion if persona is referenced by any DebateParticipant.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    const usageCount = await prisma.debateParticipant.count({
      where: { personaId: id },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          error:
            "This persona is used in one or more debates. Remove it from those debates before deleting.",
        },
        { status: 409 } // Conflict
      );
    }

    await prisma.persona.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // P2003 = FK constraint failed
    const msg =
      err?.code === "P2003"
        ? "Cannot delete: persona is referenced by debates."
        : err?.message || "Failed to delete persona";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
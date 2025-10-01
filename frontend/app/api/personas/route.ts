import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** ----------------------------- Helpers ----------------------------- */
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
  if (typeof x === "string" && x.trim().length) {
    const n = Number(x);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}
function normStringArray(x: unknown): string[] | null {
  if (Array.isArray(x)) {
    const arr = x
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
    return arr.length ? arr : [];
  }
  return null;
}

/** Map taxonomy categories to our backward-compat projection slots. */
function normalizeCategoryName(raw: string | null | undefined) {
  const c = (raw || "").toString().trim().toLowerCase();
  if (!c) return "";
  return c;
}
function deriveLegacyFields(taxonomies: Array<{ taxonomy: { id: string; category: string } }>) {
  let universityId: string | undefined;
  let organizationId: string | undefined;
  let employerId: string | undefined; // alias of organization
  let regionId: string | undefined;
  const cultureIds: string[] = [];

  for (const t of taxonomies) {
    const cat = normalizeCategoryName(t.taxonomy?.category);
    if (cat.includes("university")) {
      universityId = t.taxonomy.id;
    } else if (cat.includes("organization") || cat.includes("employer")) {
      organizationId = t.taxonomy.id;
      employerId = t.taxonomy.id;
    } else if (cat.includes("region")) {
      regionId = t.taxonomy.id;
    } else if (cat.includes("culture")) {
      cultureIds.push(t.taxonomy.id);
    }
  }
  return { universityId, organizationId, employerId, regionId, cultureIds };
}

/** ------------------------------- GET (LIST) ------------------------------- */
export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        taxonomies: { include: { taxonomy: true } },
      },
    });

    // Backward-compat projection so list consumers can read legacy fields
    const projected = personas.map((p) => {
      const legacy = deriveLegacyFields(p.taxonomies as any);
      return { ...p, ...legacy };
    });

    return NextResponse.json(projected);
  } catch (err: any) {
    console.error("GET /api/personas failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch personas" }, { status: 500 });
  }
}

/** ------------------------------- POST (CREATE) ------------------------------ */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Identity
    const name = normStr(body?.name);
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const data: any = {
      name,
      nickname: body?.nickname === undefined ? undefined : normOptStr(body?.nickname),
      ageGroup: body?.ageGroup === undefined ? undefined : normOptStr(body?.ageGroup),

      // Prefer new field, fall back to legacy 'gender'
      genderIdentity:
        body?.genderIdentity === undefined
          ? (body?.gender === undefined ? undefined : normOptStr(body?.gender))
          : normOptStr(body?.genderIdentity),

      pronouns: body?.pronouns === undefined ? undefined : normOptStr(body?.pronouns),

      // Work/role
      profession: body?.profession === undefined ? undefined : normOptStr(body?.profession),

      // Personality
      temperament: body?.temperament === undefined ? undefined : normOptStr(body?.temperament),
      confidence: body?.confidence === undefined ? undefined : normInt(body?.confidence),
      verbosity: body?.verbosity === undefined ? undefined : normInt(body?.verbosity),
      tone: body?.tone === undefined ? undefined : normOptStr(body?.tone),

      // Comms & quirks
      vocabularyStyle:
        body?.vocabularyStyle === undefined
          ? (body?.vocabulary === undefined ? undefined : normOptStr(body?.vocabulary))
          : normOptStr(body?.vocabularyStyle),
      conflictStyle: body?.conflictStyle === undefined ? undefined : normOptStr(body?.conflictStyle),
      accentNote: body?.accentNote === undefined ? undefined : normOptStr(body?.accentNote),
      voiceProvider: body?.voiceProvider === undefined ? undefined : normOptStr(body?.voiceProvider),
      voiceStyle: body?.voiceStyle === undefined ? undefined : body?.voiceStyle, // JSON pass-through

      // Arrays
      debateApproach:
        body?.debateApproach === undefined
          ? (body?.approach === undefined ? undefined : normStringArray(body?.approach))
          : normStringArray(body?.debateApproach),
      emotionMap: body?.emotionMap === undefined ? undefined : normStringArray(body?.emotionMap),
      quirks: body?.quirks === undefined ? undefined : (Array.isArray(body?.quirks) ? body.quirks : []),
    };

    // Remove undefined props so Prisma uses defaults
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // --- Build taxonomy links ---
    // Prefer explicit `taxonomyIds`, else derive from granular fields + aliases.
    let taxonomyIds: string[] | undefined = normStringArray(body?.taxonomyIds) ?? undefined;

    if (!taxonomyIds) {
      const archetypeIds = Array.isArray(body?.archetypeIds) ? body.archetypeIds : [];
      const philosophyIds = Array.isArray(body?.philosophyIds) ? body.philosophyIds : [];
      const fillerPhraseIds = Array.isArray(body?.fillerPhraseIds) ? body.fillerPhraseIds : [];
      const metaphorIds = Array.isArray(body?.metaphorIds) ? body.metaphorIds : [];
      const debateHabitIds = Array.isArray(body?.debateHabitIds) ? body.debateHabitIds : [];
      const cultureIds = Array.isArray(body?.cultureIds) ? body.cultureIds : []; // multi

      // Single-selects (support both new and legacy keys)
      const cultureId = typeof body?.cultureId === "string" ? body.cultureId : "";
      const regionId = typeof body?.regionId === "string" ? body.regionId : ""; // Region
      const communityTypeId = typeof body?.communityTypeId === "string" ? body.communityTypeId : "";
      const politicalId = typeof body?.politicalId === "string" ? body.politicalId : "";
      const religionId = typeof body?.religionId === "string" ? body.religionId : "";
      const accentId = typeof body?.accentId === "string" ? body.accentId : "";

      // Orgs/edu (support both)
      const universityId = typeof body?.universityId === "string" ? body.universityId : "";
      const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
      const employerId = typeof body?.employerId === "string" ? body.employerId : "";

      const taxoIds: string[] = [
        ...archetypeIds,
        ...philosophyIds,
        ...fillerPhraseIds,
        ...metaphorIds,
        ...debateHabitIds,
        ...cultureIds, // multi culture(s)
      ];
      if (cultureId) taxoIds.push(cultureId); // legacy single culture key
      if (regionId) taxoIds.push(regionId);
      if (communityTypeId) taxoIds.push(communityTypeId);
      if (politicalId) taxoIds.push(politicalId);
      if (religionId) taxoIds.push(religionId);
      if (accentId) taxoIds.push(accentId);
      if (universityId) taxoIds.push(universityId);
      if (organizationId) taxoIds.push(organizationId);
      if (employerId) taxoIds.push(employerId);

      taxonomyIds = taxoIds;
    }

    const persona = await prisma.persona.create({
      data: {
        ...data,
        ...(Array.isArray(taxonomyIds) && taxonomyIds.length
          ? { taxonomies: { create: taxonomyIds.map((taxonomyId: string) => ({ taxonomyId })) } }
          : {}),
      },
      include: {
        taxonomies: { include: { taxonomy: true } },
      },
    });

    // Project legacy fields back onto the response (for UI that still reads them)
    const legacy = deriveLegacyFields(persona.taxonomies as any);
    return NextResponse.json({ ...persona, ...legacy }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/personas failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to create persona" },
      { status: 500 }
    );
  }
}
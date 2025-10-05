import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePersonaDescription } from "@/lib/ai";

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
    const arr = x.map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
    return arr.length ? arr : [];
  }
  return null;
}

function normalizeCategoryName(raw: string | null | undefined) {
  const c = (raw || "").toString().trim().toLowerCase();
  if (!c) return "";
  return c;
}
function deriveLegacyFields(taxonomies: Array<{ taxonomy: { id: string; category: string } }>) {
  let universityId: string | undefined;
  let organizationId: string | undefined;
  let employerId: string | undefined; // alias
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

/** ------------------------------- GET ------------------------------- */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const persona = await prisma.persona.findUnique({
      where: { id: params.id },
      include: { taxonomies: { include: { taxonomy: true } } },
    });

    if (!persona) return NextResponse.json({ error: "Persona not found" }, { status: 404 });

    const legacy = deriveLegacyFields(persona.taxonomies as any);
    return NextResponse.json({ ...persona, ...legacy });
  } catch (err: any) {
    console.error("GET /api/personas/[id] failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch persona" }, { status: 500 });
  }
}

/** ------------------------------- PUT ------------------------------- */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const data: any = {
      // Identity
      name: body?.name === undefined ? undefined : normStr(body?.name),
      nickname: body?.nickname === undefined ? undefined : normOptStr(body?.nickname),
      ageGroup: body?.ageGroup === undefined ? undefined : normOptStr(body?.ageGroup),
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
      quirks:
        body?.quirks === undefined
          ? undefined
          : (Array.isArray(body?.quirks) ? body.quirks : []),
    };

    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // taxonomyIds explicit or derive from aliases
    let taxonomyIds: string[] | undefined = normStringArray(body?.taxonomyIds) ?? undefined;

    if (!taxonomyIds) {
      const archetypeIds = Array.isArray(body?.archetypeIds) ? body.archetypeIds : [];
      const philosophyIds = Array.isArray(body?.philosophyIds) ? body.philosophyIds : [];
      const fillerPhraseIds = Array.isArray(body?.fillerPhraseIds) ? body.fillerPhraseIds : [];
      const metaphorIds = Array.isArray(body?.metaphorIds) ? body.metaphorIds : [];
      const debateHabitIds = Array.isArray(body?.debateHabitIds) ? body.debateHabitIds : [];
      const cultureIds = Array.isArray(body?.cultureIds) ? body.cultureIds : [];

      const cultureId = typeof body?.cultureId === "string" ? body.cultureId : "";
      const regionId = typeof body?.regionId === "string" ? body.regionId : "";
      const communityTypeId = typeof body?.communityTypeId === "string" ? body.communityTypeId : "";
      const politicalId = typeof body?.politicalId === "string" ? body.politicalId : "";
      const religionId = typeof body?.religionId === "string" ? body.religionId : "";
      const accentId = typeof body?.accentId === "string" ? body.accentId : "";

      const universityId = typeof body?.universityId === "string" ? body.universityId : "";
      const organizationId = typeof body?.organizationId === "string" ? body.organizationId : "";
      const employerId = typeof body?.employerId === "string" ? body.employerId : "";

      const taxoIds: string[] = [
        ...archetypeIds,
        ...philosophyIds,
        ...fillerPhraseIds,
        ...metaphorIds,
        ...debateHabitIds,
        ...cultureIds,
      ];
      if (cultureId) taxoIds.push(cultureId);
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

    // Update + replace taxonomy joins atomically
    await prisma.$transaction([
      prisma.persona.update({
        where: { id: params.id },
        data,
      }),
      prisma.personaTaxonomy.deleteMany({ where: { personaId: params.id } }),
      ...(Array.isArray(taxonomyIds) && taxonomyIds.length
        ? [
            prisma.personaTaxonomy.createMany({
              data: taxonomyIds.map((taxonomyId: string) => ({ personaId: params.id, taxonomyId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    // Generate + save description (never leave it empty)
    try {
      const enriched = await prisma.persona.findUnique({
        where: { id: params.id },
        include: { taxonomies: { include: { taxonomy: true } } },
      });

      if (enriched) {
        const expertise =
          (enriched.taxonomies || [])
            .map((pt: any) => pt.taxonomy?.term || pt.taxonomy?.name)
            .filter(Boolean) ?? [];

        const text = await generatePersonaDescription({
          id: enriched.id,
          name: enriched.name,
          nickname: (enriched as any).nickname ?? null,
          bio: (enriched as any).bio ?? null,
          culturalBackground: (enriched as any).culturalBackground ?? null,
          profession: (enriched as any).profession ?? null,
          education: (enriched as any).education ?? null,
          worldview: (enriched as any).worldview ?? null,
          temperament: (enriched as any).temperament ?? null,
          conflictStyle: (enriched as any).conflictStyle ?? null,
          vocabularyStyle: (enriched as any).vocabularyStyle ?? null,
          debateApproach: (enriched as any).debateApproach ?? [],
          quirks: (enriched as any).quirks ?? [],
          expertise,
        });

        const description = text?.trim().length ? text.trim() : "(auto) In debates, this persona balances clarity with curiosity.";
        await prisma.persona.update({ where: { id: params.id }, data: { description } });
        console.log("[AI] description updated for persona", params.id, `(${description.slice(0, 40)}...)`);
      }
    } catch (e) {
      console.error("AI description generation failed (PUT /api/personas/[id]):", e);
    }

    // Final response (fresh)
    const persona = await prisma.persona.findUnique({
      where: { id: params.id },
      include: { taxonomies: { include: { taxonomy: true } } },
    });

    const legacy = deriveLegacyFields(persona?.taxonomies as any);
    return NextResponse.json({ ...persona, ...legacy });
  } catch (err: any) {
    console.error("PUT /api/personas/[id] failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to update persona" },
      { status: 500 }
    );
  }
}
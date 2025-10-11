import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- helpers ---------------------------------------------------------------

function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function resolveCategory(input: string) {
  const value = String(input || "").trim();
  if (!value) return null;

  // Prefer key; fallback to fullName (both case-insensitive)
  const byKey = await prisma.taxonomyCategory.findFirst({
    where: { key: { equals: value, mode: "insensitive" } },
    select: { id: true, key: true, fullName: true },
  });
  if (byKey) return byKey;

  const byFullName = await prisma.taxonomyCategory.findFirst({
    where: { fullName: { equals: value, mode: "insensitive" } },
    select: { id: true, key: true, fullName: true },
  });
  return byFullName;
}

// --- GET (single) ----------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const item = await prisma.taxonomy.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...item,
      createdAt:
        item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    });
  } catch (e) {
    console.error("GET /api/taxonomy/terms/[id] failed", e);
    return NextResponse.json({ error: "Failed to load term" }, { status: 500 });
  }
}

// --- PUT (update) ----------------------------------------------------------

/**
 * PUT /api/taxonomy/terms/:id
 * Body accepts any of: { term, description, isActive, category }
 * - If `term` changes, `slug` is re-generated.
 * - `category` may be key or fullName; we store the **key** (canonical) and set categoryId.
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const existing = await prisma.taxonomy.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (typeof body.term === "string") {
      const term = body.term.trim();
      if (!term) return NextResponse.json({ error: "Term cannot be empty" }, { status: 400 });
      updateData.term = term;
      // keep slug in sync
      updateData.slug = slugify(term);
    }

    if (typeof body.description === "string") {
      updateData.description = body.description;
    }

    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }

    if (typeof body.category === "string" && body.category.trim()) {
      const cat = await resolveCategory(body.category);
      updateData.category = cat ? cat.key : body.category.trim(); // store KEY
      updateData.categoryId = cat ? cat.id : null;
    }

    const updated = await prisma.taxonomy.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      createdAt:
        updated.createdAt instanceof Date
          ? updated.createdAt.toISOString()
          : updated.createdAt,
    });
  } catch (e: any) {
    if (e && e.code === "P2002") {
      return NextResponse.json(
        { error: "A term with this name already exists in the selected category." },
        { status: 409 }
      );
    }
    console.error("PUT /api/taxonomy/terms/[id] failed", e);
    return NextResponse.json({ error: "Failed to update term" }, { status: 500 });
  }
}

// --- DELETE (optional) -----------------------------------------------------

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.taxonomy.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("DELETE /api/taxonomy/terms/[id] failed", e);
    return NextResponse.json({ error: "Failed to delete term" }, { status: 500 });
  }
}
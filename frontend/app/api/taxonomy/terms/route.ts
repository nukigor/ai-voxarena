import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper: slugify a term for nicer URLs and uniqueness helpers
function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

type CatResolved = {
  id: string;
  key: string;
  fullName: string;
};

/**
 * Resolve a taxonomy category by either key or fullName (case-insensitive).
 * Returns id, key, fullName when found; otherwise null.
 */
async function resolveCategory(input: string): Promise<CatResolved | null> {
  const value = String(input || "").trim();
  if (!value) return null;

  // Try by key first (preferred), then by fullName
  const byKey = await prisma.taxonomyCategory.findFirst({
    where: { key: { equals: value, mode: "insensitive" } },
    select: { id: true, key: true, fullName: true },
  });
  if (byKey) return byKey as CatResolved;

  const byFullName = await prisma.taxonomyCategory.findFirst({
    where: { fullName: { equals: value, mode: "insensitive" } },
    select: { id: true, key: true, fullName: true },
  });
  return (byFullName as CatResolved) ?? null;
}

/**
 * GET /api/taxonomy/terms?category=...&page=1&pageSize=20
 * Returns a paginated list of taxonomy terms for the given category.
 * The query param may be EITHER the category key (preferred) or the fullName.
 * We store Taxonomy.category as the **key** now, but still match legacy data that
 * might have a string fullName.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryParam = searchParams.get("category");
    if (!categoryParam) {
      return NextResponse.json({ error: "Missing category" }, { status: 400 });
    }

    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || "20")));
    const skip = (page - 1) * pageSize;

    const cat = await resolveCategory(categoryParam);

    const where = cat
      ? {
          OR: [
            { categoryId: cat.id },
            { category: cat.key },      // current canonical storage
            { category: cat.fullName }, // legacy storage fallback
          ],
        }
      : {
          // If we can't resolve, search by what we were given to stay useful.
          OR: [{ category: categoryParam }],
        };

    const [items, total] = await Promise.all([
      prisma.taxonomy.findMany({
        where,
        orderBy: { term: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.taxonomy.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((it) => ({
        ...it,
        createdAt: it.createdAt instanceof Date ? it.createdAt.toISOString() : it.createdAt,
      })),
      total,
      page,
      pageSize,
    });
  } catch (e) {
    console.error("GET /api/taxonomy/terms failed", e);
    return NextResponse.json({ error: "Failed to load terms" }, { status: 500 });
  }
}

/**
 * POST /api/taxonomy/terms
 * Body: { term: string, description?: string, isActive?: boolean, category: string }
 * Creates a new taxonomy term and links it to TaxonomyCategory when possible.
 * IMPORTANT: We now persist Taxonomy.category as the **category key**.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const term = String(body.term || "").trim();
    const categoryInput = String(body.category || "").trim();
    const description = typeof body.description === "string" ? body.description : "";
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

    if (!term) return NextResponse.json({ error: "Term is required" }, { status: 400 });
    if (!categoryInput) return NextResponse.json({ error: "Category is required" }, { status: 400 });

    const cat = await resolveCategory(categoryInput);

    const created = await prisma.taxonomy.create({
      data: {
        term,
        slug: slugify(term),
        description,
        isActive,
        // Store the key if we were able to resolve; otherwise store the raw input (assumed to be key).
        category: cat ? cat.key : categoryInput,
        categoryId: cat ? cat.id : null,
      },
    });

    return NextResponse.json(
      { ...created, createdAt: created.createdAt.toISOString() },
      { status: 201 }
    );
  } catch (e: any) {
    if (e && e.code === "P2002") {
      return NextResponse.json(
        { error: "This term already exists in the selected category." },
        { status: 409 }
      );
    }
    console.error("POST /api/taxonomy/terms failed", e);
    return NextResponse.json({ error: "Failed to create term" }, { status: 500 });
  }
}
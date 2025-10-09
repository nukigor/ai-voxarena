import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// utility: make a slug from full name if key not provided
function toSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// GET /api/taxonomycategories?page=x&pageSize=y
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));

    // Raw count keeps it immune to any global pagination middleware
    const totalRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT CAST(COUNT(*) AS INT) AS count
      FROM "public"."TaxonomyCategory"
    `;
    const total = totalRows?.[0]?.count ?? 0;

    const items = await prisma.taxonomyCategory.findMany({
      orderBy: { fullName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({ items, total, page, pageSize });
  } catch (e) {
    console.error("GET /api/taxonomycategories failed", e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

// POST /api/taxonomycategories
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, description, key } = body || {};

    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    const computedKey = key && typeof key === "string" && key.trim() !== "" ? key : toSlug(fullName);

    const created = await prisma.taxonomyCategory.create({
      data: {
        fullName,
        description: description || null,
        key: computedKey,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    const msg = e?.code === "P2002"
      ? "A category with this key or full name already exists"
      : "Failed to create category";
    console.error("POST /api/taxonomycategories failed", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
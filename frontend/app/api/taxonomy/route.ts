import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const where = category ? { category } : undefined;
    const items = await prisma.taxonomy.findMany({
      where,
      orderBy: [{ category: "asc" }, { term: "asc" }],
      select: { id: true, term: true, category: true },
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error("GET /api/taxonomy failed", e);
    return NextResponse.json({ error: "Failed to load taxonomy" }, { status: 500 });
  }
}
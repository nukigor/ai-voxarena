import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Return a distinct, sorted list of taxonomy categories.
// This is a new endpoint to avoid changing existing /api/taxonomy behavior.
export async function GET() {
  try {
    const rows = await prisma.taxonomy.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    const categories = rows.map((r) => r.category);
    return NextResponse.json(categories);
  } catch (e) {
    console.error("GET /api/taxonomy/categories failed", e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/taxonomy/terms?category=...&page=1&pageSize=20
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    if (!category) {
      return NextResponse.json(
        { error: "Missing category" },
        { status: 400 }
      );
    }
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || "20")));

    const where = { category };

    const [total, items] = await Promise.all([
      prisma.taxonomy.count({ where }),
      prisma.taxonomy.findMany({
        where,
        orderBy: [{ term: "asc" }],
        select: {
          id: true,
          term: true,
          slug: true,
          isActive: true,
          description: true,
          createdAt: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    // Serialize dates
    const payload = {
      items: items.map((it) => ({
        ...it,
        createdAt: it.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error("GET /api/taxonomy/terms failed", e);
    return NextResponse.json({ error: "Failed to load terms" }, { status: 500 });
  }
}
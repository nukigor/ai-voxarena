import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// GET /api/taxonomycategories/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const item = await prisma.taxonomyCategory.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (e) {
    console.error("GET /api/taxonomycategories/[id] failed", e);
    return NextResponse.json({ error: "Failed to load category" }, { status: 500 });
  }
}

// PUT /api/taxonomycategories/:id
export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const { name, description } = body || {};
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const updated = await prisma.taxonomyCategory.update({
      where: { id: params.id },
      data: { name, description: description ?? null },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    const msg = e?.code === "P2002" ? "A category with this name already exists" : "Failed to update category";
    console.error("PUT /api/taxonomycategories/[id] failed", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/taxonomycategories/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.taxonomyCategory.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/taxonomycategories/[id] failed", e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
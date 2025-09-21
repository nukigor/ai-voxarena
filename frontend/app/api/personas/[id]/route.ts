import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const persona = await prisma.persona.findUnique({
    where: { id: params.id },
    include: { taxonomies: { include: { taxonomy: true } } },
  });
  return NextResponse.json(persona);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const persona = await prisma.persona.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(persona);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.persona.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
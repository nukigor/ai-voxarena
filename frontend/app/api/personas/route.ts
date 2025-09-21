import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const personas = await prisma.persona.findMany({
      include: { 
        taxonomies: {           // 👈 rename this
          include: { taxonomy: true },
        },
      },
    });
    return NextResponse.json(personas);
  } catch (err) {
    console.error("❌ GET /api/personas failed:", err);
    return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const persona = await prisma.persona.create({ data });
    return NextResponse.json(persona);
  } catch (err) {
    console.error("❌ POST /api/personas failed:", err);
    return NextResponse.json({ error: "Failed to create persona" }, { status: 500 });
  }
}
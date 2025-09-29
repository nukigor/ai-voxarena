import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normStr(x: unknown, fallback = ""): string {
  return (typeof x === "string" ? x : fallback).trim();
}

type IncomingParticipant = {
  personaId: string;
  role: "MODERATOR" | "DEBATER" | "HOST" | "GUEST";
  order?: number;
  displayName?: string | null;
  voiceId?: string | null;
  meta?: any;
};

function normalizeParticipants(arr: unknown): IncomingParticipant[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p, i) => ({
      personaId: normStr(p?.personaId),
      role: normStr(p?.role).toUpperCase() as IncomingParticipant["role"],
      order: typeof p?.order === "number" ? p.order : i,
      displayName: typeof p?.displayName === "string" ? p.displayName : null,
      voiceId: typeof p?.voiceId === "string" ? p.voiceId : null,
      meta: p?.meta ?? null,
    }))
    .filter((p) => p.personaId && p.role);
}

// GET /api/debates  -> list debates
export async function GET() {
  try {
    const debates = await prisma.debate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        participants: {
          orderBy: { orderIndex: "asc" },
          include: {
            persona: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          },
        },
      },
    });
    return NextResponse.json(debates);
  } catch (err: any) {
    console.error("GET /api/debates failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to load debates" }, { status: 500 });
  }
}

// POST /api/debates -> create debate (DRAFT can be saved without participants)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = normStr(body?.title);
    const topic = normStr(body?.topic);
    const description = body?.description ? normStr(body.description) : null;
    const format = normStr(body?.format || "structured").toLowerCase(); // required by UI
    const status = normStr(body?.status || "DRAFT").toUpperCase();       // defaults to DRAFT
    const config = body?.config ?? null;

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
    if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });
    if (!format) return NextResponse.json({ error: "format is required" }, { status: 400 });

    const participants = normalizeParticipants(body?.participants);

    // ✅ Key relaxation:
    // If no participants are provided, allow saving as DRAFT (or any status),
    // and skip role validation. If participants ARE provided, validate by format.
    if (participants.length > 0) {
      if (format === "structured") {
        const hasMod = participants.some((p) => p.role === "MODERATOR");
        const debaters = participants.filter((p) => p.role === "DEBATER").length;
        if (!hasMod || debaters < 2) {
          return NextResponse.json(
            { error: "structured debate requires 1 moderator and at least 2 debaters" },
            { status: 400 }
          );
        }
      } else if (format === "podcast") {
        const hasHost = participants.some((p) => p.role === "HOST");
        const guests = participants.filter((p) => p.role === "GUEST").length;
        if (!hasHost || guests < 1) {
          return NextResponse.json(
            { error: "podcast debate requires 1 host and at least 1 guest" },
            { status: 400 }
          );
        }
      }
    }

    const created = await prisma.debate.create({
      data: {
        title,
        topic,
        description,
        format,
        status,
        config,
        participants: participants.length
          ? {
              create: participants.map((p) => ({
                personaId: p.personaId,
                role: p.role,
                orderIndex: p.order ?? 0, // map 'order' -> 'orderIndex'
                displayName: p.displayName || null,
                voiceId: p.voiceId || null,
                meta: p.meta ?? undefined,
              })),
            }
          : undefined,
      },
      include: {
        participants: {
          orderBy: { orderIndex: "asc" },
          include: {
            persona: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/debates failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create debate" }, { status: 500 });
  }
}
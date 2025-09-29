import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normStr(x: unknown, fallback = ""): string {
  return (typeof x === "string" ? x : fallback).trim();
}

type IncomingParticipant = {
  id?: string;
  personaId: string;
  role: "MODERATOR" | "DEBATER" | "HOST" | "GUEST";
  order?: number; // incoming convenience
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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const debate = await prisma.debate.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        orderBy: { orderIndex: "asc" }, // ✅
        include: {
          persona: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!debate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(debate);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const title = body?.title !== undefined ? normStr(body.title) : undefined;
    const topic = body?.topic !== undefined ? normStr(body.topic) : undefined;
    const description =
      body?.description !== undefined ? (normStr(body.description) || null) : undefined;
    const format = body?.format ? normStr(body.format).toLowerCase() : undefined;
    const status = body?.status ? normStr(body.status).toUpperCase() : undefined;
    const config = body?.config ?? undefined;

    const participants = normalizeParticipants(body?.participants);

    if (format === "structured" && participants.length > 0) {
      const hasMod = participants.some((p) => p.role === "MODERATOR");
      const debaters = participants.filter((p) => p.role === "DEBATER").length;
      if (!hasMod || debaters < 2) {
        return NextResponse.json(
          { error: "structured debate requires 1 moderator and at least 2 debaters" },
          { status: 400 }
        );
      }
    }
    if (format === "podcast" && participants.length > 0) {
      const hasHost = participants.some((p) => p.role === "HOST");
      const guests = participants.filter((p) => p.role === "GUEST").length;
      if (!hasHost || guests < 1) {
        return NextResponse.json(
          { error: "podcast debate requires 1 host and at least 1 guest" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.debate.update({
      where: { id: params.id },
      data: {
        title,
        topic,
        description,
        format,
        status,
        config,
        ...(participants.length
          ? {
              participants: {
                deleteMany: {},
                create: participants.map((p) => ({
                  personaId: p.personaId,
                  role: p.role,
                  orderIndex: p.order ?? 0, // ✅ map incoming 'order' -> 'orderIndex'
                  displayName: p.displayName || null,
                  voiceId: p.voiceId || null,
                  meta: p.meta ?? undefined,
                })),
              },
            }
          : {}),
      },
      include: {
        participants: {
          orderBy: { orderIndex: "asc" }, // ✅
          include: {
            persona: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/debates/[id] failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update debate" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.debate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to delete debate" }, { status: 500 });
  }
}
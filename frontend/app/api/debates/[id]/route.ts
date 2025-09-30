import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* ----------------------------- helpers ----------------------------- */

function normStr(x: unknown, fallback = ""): string {
  return (typeof x === "string" ? x : fallback).trim();
}

type IncomingParticipant = {
  personaId: string;
  role: "MODERATOR" | "DEBATER" | "HOST" | "GUEST";
  order?: number; // UI sends order (mapped server-side to orderIndex)
  displayName?: string | null;
  voiceId?: string | null;
  meta?: any;
};

function normalizeParticipants(arr: unknown): IncomingParticipant[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((p, i) => ({
      personaId: normStr((p as any)?.personaId),
      role: normStr((p as any)?.role).toUpperCase() as IncomingParticipant["role"],
      order: typeof (p as any)?.order === "number" ? (p as any).order : i,
      displayName: typeof (p as any)?.displayName === "string" ? (p as any).displayName : null,
      voiceId: typeof (p as any)?.voiceId === "string" ? (p as any).voiceId : null,
      meta: (p as any)?.meta ?? null,
    }))
    .filter((p) => p.personaId && p.role);
}

/* -------------------------------- GET ------------------------------ */

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const debate = await prisma.debate.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        orderBy: { orderIndex: "asc" },
        include: {
          persona: { select: { id: true, name: true, nickname: true, avatarUrl: true, debateApproach: true, temperament: true, conflictStyle: true, vocabularyStyle: true } },
        },
      },
    },
  });
  if (!debate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(debate);
}

/* -------------------------------- PUT ------------------------------ */

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const title = body?.title !== undefined ? normStr(body.title) : undefined;
    const topic = body?.topic !== undefined ? normStr(body.topic) : undefined;
    const description = body?.description !== undefined ? normStr(body.description) || null : undefined;
    const format = body?.format ? normStr(body.format).toLowerCase() : undefined;
    const status = body?.status ? normStr(body.status).toUpperCase() : undefined;
    const config = body?.config ?? undefined;

    const participants = normalizeParticipants(body?.participants);

    // Validate only if participants payload provided
    if (participants.length > 0 && format) {
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
                deleteMany: {}, // replace all
                create: participants.map((p) => ({
                  personaId: p.personaId,
                  role: p.role,
                  orderIndex: p.order ?? 0,
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
          orderBy: { orderIndex: "asc" },
          include: {
            persona: { select: { id: true, name: true, nickname: true, avatarUrl: true, debateApproach: true, temperament: true, conflictStyle: true, vocabularyStyle: true } },
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

/* ------------------------------- DELETE ---------------------------- */

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    // Your requirement: do not delete personas; just remove their membership.
    // Safest approach: delete participant rows first, then delete the debate.
    await prisma.debateParticipant.deleteMany({ where: { debateId: params.id } });
    await prisma.debate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/debates/[id] failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete debate" }, { status: 500 });
  }
}
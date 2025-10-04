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

// normalize incoming participants payload
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

function validateParticipantsForFormat(format: string, participants: IncomingParticipant[]) {
  if (format === "structured") {
    const hasMod = participants.some((p) => p.role === "MODERATOR");
    const debaters = participants.filter((p) => p.role === "DEBATER").length;
    if (!hasMod || debaters < 2) {
      return "structured debate requires 1 moderator and at least 2 debaters";
    }
  } else if (format === "podcast") {
    const hasHost = participants.some((p) => p.role === "HOST");
    const guests = participants.filter((p) => p.role === "GUEST").length;
    if (!hasHost || guests < 1) {
      return "podcast debate requires 1 host and at least 1 guest";
    }
  }
  return null;
}

type Status = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
const allowedTransitions: Record<Status, Status[]> = {
  DRAFT: ["DRAFT", "ACTIVE"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [], // terminal
};

/* -------------------------------- GET ------------------------------ */

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const debate = await prisma.debate.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        orderBy: { orderIndex: "asc" },
        include: {
          persona: {
            select: {
              id: true,
              name: true,
              nickname: true,
              avatarUrl: true,
              debateApproach: true,
              temperament: true,
              conflictStyle: true,
              vocabularyStyle: true,
            },
          },
        },
      },
    },
  });
  if (!debate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(debate);
}

/* -------------------------------- PATCH ---------------------------- */

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    // Load current for transition checks
    const current = await prisma.debate.findUnique({
      where: { id: params.id },
      include: { participants: true },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const title = body?.title !== undefined ? normStr(body.title) : undefined;
    const topic = body?.topic !== undefined ? normStr(body.topic) : undefined;
    const description = body?.description !== undefined ? (normStr(body.description) || null) : undefined;
    const format = body?.format !== undefined ? normStr(body.format).toLowerCase() : undefined;
    const status = body?.status ? (normStr(body.status).toUpperCase() as Status) : undefined;
    const config = body?.config ?? undefined;

    const participants = normalizeParticipants(body?.participants);

    // If participants provided, replace all after validating against format (use next format if provided, else current)
    if (participants.length > 0) {
      const f = (format || current.format || "structured").toLowerCase();
      const err = validateParticipantsForFormat(f, participants);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      // replace set
      await prisma.debateParticipant.deleteMany({ where: { debateId: current.id } });
      await prisma.debateParticipant.createMany({
        data: participants.map((p) => ({
          debateId: current.id,
          personaId: p.personaId,
          role: p.role,
          orderIndex: typeof p.order === "number" ? p.order : 0,
          displayName: p.displayName ?? null,
          voiceId: p.voiceId ?? null,
          meta: p.meta ?? null,
        })),
      });
    }

    // Handle status transition rules
    if (status) {
      const from = (current.status || "DRAFT").toUpperCase() as Status;
      const allowed = allowedTransitions[from] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Illegal status transition: ${from} → ${status}` },
          { status: 400 }
        );
      }
      // If moving into ACTIVE, enforce minimum participants based on (new) format and existing/updated participants
      if (status === "ACTIVE") {
        const f = (format || current.format || "structured").toLowerCase();
        const participantsNow =
          participants.length > 0
            ? participants
            : current.participants.map((p: any) => ({
                personaId: p.personaId,
                role: p.role as any,
              }));
        const err = validateParticipantsForFormat(f, participantsNow as any);
        if (err) return NextResponse.json({ error: err }, { status: 400 });
      }
    }

    const updated = await prisma.debate.update({
      where: { id: current.id },
      data: {
        title,
        topic,
        description,
        format,
        status,
        config,
      },
      include: {
        participants: {
          orderBy: { orderIndex: "asc" },
          include: { persona: { select: { id: true, name: true, nickname: true, avatarUrl: true } } },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PATCH /api/debates/[id] failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update debate" }, { status: 500 });
  }
}

/* ------------------------------- DELETE ---------------------------- */

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    // Do not delete personas; just remove their membership first, then the debate.
    await prisma.debateParticipant.deleteMany({ where: { debateId: params.id } });
    await prisma.debate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/debates/[id] failed:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete debate" }, { status: 500 });
  }
}
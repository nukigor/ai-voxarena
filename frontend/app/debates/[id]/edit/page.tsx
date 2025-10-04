"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { TextField } from "@/components/ui/forms/TextField";
import { TextAreaField } from "@/components/ui/forms/TextAreaField";
import { SingleSelect } from "@/components/ui/forms/SingleSelect";
import {
  debateFormats,
  debateConfigDefaults,
  type DebateFormat,
  isDebateFormat,
} from "@/lib/debateOptions";
import DebateParticipantsPanel, {
  type DebateParticipantDraft,
} from "@/components/debate/DebateParticipantsPanel";
import ConfirmSaveModal from "@/components/ui/ConfirmSaveModal";
import ConfirmDiscardModal from "@/components/ui/ConfirmDiscardModal";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditDebatePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const { data, mutate } = useSWR(id ? `/api/debates/${id}` : null, fetcher);

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<DebateFormat | "">("");
  const [config, setConfig] = useState<any>(null);
  const [participants, setParticipants] = useState<DebateParticipantDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null); // "active" | "completed" | "archived"

  // confirmation modals
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setTopic(data.topic ?? "");
    setDescription(data.description ?? "");
    setFormat(data.format ?? "");
    setConfig(data.config ?? null);
    setParticipants(
      (data.participants || []).map((pt: any, i: number) => ({
        personaId: pt.personaId,
        role: (pt.role || "") as any,
        order: typeof pt.orderIndex === "number" ? pt.orderIndex : i,
        persona: {
          id: pt.persona?.id,
          name: pt.persona?.name,
          nickname: pt.persona?.nickname,
          avatarUrl: pt.persona?.avatarUrl,
          debateApproach: pt.persona?.debateApproach || [],
          temperament: pt.persona?.temperament || null,
          conflictStyle: pt.persona?.conflictStyle || null,
          vocabularyStyle: pt.persona?.vocabularyStyle || null,
        },
      }))
    );
  }, [data]);

  useEffect(() => {
    if (isDebateFormat(format)) setConfig(debateConfigDefaults[format]);
    else setConfig(null);
  }, [format]);

  const meetsMinimum = useMemo(() => {
    if (!isDebateFormat(format)) return false;
    const roles = participants.map((p) => (p.role || (format === "podcast" ? "GUEST" : "DEBATER")) as string);
    if (format === "podcast") {
      const host = roles.includes("HOST");
      const guests = roles.filter((r) => r === "GUEST").length;
      return host && guests >= 1;
    }
    const mod = roles.includes("MODERATOR");
    const debaters = roles.filter((r) => r === "DEBATER").length;
    return mod && debaters >= 2;
  }, [participants, format]);

  function onClickSaveDraft() {
    setShowConfirmSave(true);
  }
  function onClickCancel() {
    setShowConfirmDiscard(true);
  }

  async function actuallySaveDraft() {
    try {
      setSaving(true);
      setSaveError(null);

      const res = await fetch(`/api/debates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic,
          description,
          format: format || "structured",
          status: "DRAFT",
          config,
          participants: participants.map((p, i) => ({
            personaId: p.personaId,
            role: p.role || (format === "podcast" ? "GUEST" : "DEBATER"),
            order: i,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save");

      mutate();
      router.push("/debates");
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
      setShowConfirmSave(false);
    }
  }

  async function transition(nextStatus: "ACTIVE" | "COMPLETED" | "ARCHIVED") {
    try {
      setActionBusy(nextStatus.toLowerCase());
      const res = await fetch(`/api/debates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Failed to set ${nextStatus}`);
      mutate();
    } catch (e) {
      alert((e as any).message);
    } finally {
      setActionBusy(null);
    }
  }

  const status = (data?.status || "DRAFT") as "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit debate</h1>
        <span className="rounded-full border border-gray-200 px-3 py-1 text-xs uppercase tracking-wide text-gray-600 dark:border:white/10 dark:text-gray-300">
          Status: {status}
        </span>
      </div>

      {saveError && <p className="mb-4 text-red-600">{saveError}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 65% */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 shadow-xs dark:border-white/10">
            <div className="space-y-4">
              <TextField label="Title" value={title} onChange={setTitle} required />
              <TextField label="Topic" value={topic} onChange={setTopic} required />
              <TextAreaField label="Description" value={description} onChange={setDescription} rows={4} />
              <SingleSelect
                label="Format"
                value={format}
                onChange={setFormat}
                options={debateFormats}
                placeholder="Select…"
                required
              />
            </div>
          </div>
        </div>

        {/* Right 35% */}
        <div className="lg:col-span-4">
          <DebateParticipantsPanel
            format={format}
            participants={participants}
            setParticipants={setParticipants}
          />
        </div>
      </div>

      {/* ACTION BAR — right aligned to match Create page */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClickCancel}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onClickSaveDraft}
          disabled={saving || !title || !topic || !isDebateFormat(format)}
          className="rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Save draft
        </button>

        {/* Run only from DRAFT and when min is met */}
        <button
          type="button"
          onClick={() => transition("ACTIVE")}
          disabled={status !== "DRAFT" || !meetsMinimum || actionBusy !== null}
          title={status !== "DRAFT" ? "Only drafts can be started" : (!meetsMinimum ? "Add the minimum required personas for this format" : undefined)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {actionBusy === "active" ? "Starting…" : "Run debate"}
        </button>
      </div>

      {/* Secondary actions remain contextual (right aligned) */}
      <div className="mt-4 flex justify-end gap-3">
        {status === "ACTIVE" && (
          <button
            type="button"
            onClick={() => transition("COMPLETED")}
            disabled={actionBusy !== null}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            {actionBusy === "completed" ? "Marking…" : "Mark completed"}
          </button>
        )}

        {status === "COMPLETED" && (
          <button
            type="button"
            onClick={() => transition("ARCHIVED")}
            disabled={actionBusy !== null}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            {actionBusy === "archived" ? "Archiving…" : "Archive"}
          </button>
        )}
      </div>

      {/* Modals */}
      <ConfirmSaveModal
        open={showConfirmSave}
        title="Save draft debate?"
        message="This will save the current draft debate to your database. You can edit it later."
        confirmText={saving ? "Saving…" : "Save"}
        onCancel={() => setShowConfirmSave(false)}
        onConfirm={actuallySaveDraft}
      />
      <ConfirmDiscardModal
        open={showConfirmDiscard}
        onKeep={() => setShowConfirmDiscard(false)}
        onDiscard={() => router.push("/debates")}
      />
    </div>
  );
}
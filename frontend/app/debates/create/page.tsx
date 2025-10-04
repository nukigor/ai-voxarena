"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
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

export default function CreateDebatePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<DebateFormat | "">("");
  const [config, setConfig] = useState<any>(null);
  const [participants, setParticipants] = useState<DebateParticipantDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDebateFormat(format)) setConfig(debateConfigDefaults[format]);
    else setConfig(null);
  }, [format]);

  // Minimal requirements per format:
  const meetsMinimum = useMemo(() => {
    if (!isDebateFormat(format)) return false;
    const roles = participants.map((p) => (p.role || (format === "podcast" ? "GUEST" : "DEBATER")) as string);
    if (format === "podcast") {
      const host = roles.includes("HOST");
      const guests = roles.filter((r) => r === "GUEST").length;
      return host && guests >= 1;
    }
    // structured
    const mod = roles.includes("MODERATOR");
    const debaters = roles.filter((r) => r === "DEBATER").length;
    return mod && debaters >= 2;
  }, [participants, format]);

  async function handleSaveDraft() {
    try {
      setSaving(true);
      setError(null);

      const payload = {
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
      };

      const res = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save draft");

      router.push("/debates");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRunDebate() {
    try {
      setRunning(true);
      setError(null);

      // First, create (as DRAFT), then transition -> ACTIVE
      const resCreate = await fetch("/api/debates", {
        method: "POST",
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
      const created = await resCreate.json();
      if (!resCreate.ok) throw new Error(created?.error || "Failed to create debate");

      const resRun = await fetch(`/api/debates/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      const runJson = await resRun.json();
      if (!resRun.ok) throw new Error(runJson?.error || "Failed to run debate");

      router.push(`/debates/${created.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Create debate</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
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

        <div className="lg:col-span-4">
          <DebateParticipantsPanel
            format={format}
            participants={participants}
            setParticipants={setParticipants}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/debates")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={saving || !title || !topic || !isDebateFormat(format)}
          className="rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>

        <button
          type="button"
          onClick={handleRunDebate}
          disabled={running || !isDebateFormat(format) || !meetsMinimum}
          title={!meetsMinimum ? "Add the minimum required personas for this format" : undefined}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {running ? "Starting…" : "Run debate"}
        </button>
      </div>
    </div>
  );
}
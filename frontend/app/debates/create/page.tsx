"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  const [format, setFormat] = useState<string>("");
  const [config, setConfig] = useState<any | null>(null);

  const [participants, setParticipants] = useState<DebateParticipantDraft[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isDebateFormat(format)) setConfig(debateConfigDefaults[format]);
    else setConfig(null);
  }, [format]);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      if (!title || !topic) throw new Error("Title and Topic are required");
      if (!isDebateFormat(format)) throw new Error("Please select a Format");

      const payload = {
        title,
        topic,
        description,
        format,
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
      if (!res.ok) throw new Error(json?.error || "Failed to create debate");

      router.push("/debates");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Create debate</h1>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {/* 65 / 35 split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: form (65%) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 shadow-xs dark:border-white/10">
            <div className="space-y-4">
              <TextField label="Title" value={title} onChange={setTitle} required />
              <TextField label="Topic" value={topic} onChange={setTopic} required />
              <TextAreaField
                label="Description"
                value={description}
                onChange={setDescription}
                rows={4}
              />
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

        {/* Right: personas panel (35%) */}
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
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title || !topic || !isDebateFormat(format)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
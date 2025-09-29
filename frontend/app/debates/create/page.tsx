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

export default function CreateDebatePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  // Start empty so placeholder shows; user must select
  const [format, setFormat] = useState<string>(""); 
  const [config, setConfig] = useState<any | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When format changes, set defaults or clear
  useEffect(() => {
    if (isDebateFormat(format)) {
      setConfig(debateConfigDefaults[format]);
    } else {
      setConfig(null);
    }
  }, [format]);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      if (!isDebateFormat(format)) {
        throw new Error("Please select a format");
      }

      const res = await fetch("/api/debates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic,
          description,
          format,   // "structured" | "podcast"
          config,   // defaults for the selected format
          // status defaults to "DRAFT" (schema)
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create debate");

      router.push("/debates");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Debate</h1>

      {error && <p className="text-red-600">{error}</p>}

      <div className="space-y-4">
        <TextField label="Title" value={title} onChange={setTitle} required />
        <TextField label="Topic" value={topic} onChange={setTopic} required />
        <TextAreaField label="Description" value={description} onChange={setDescription} rows={4} />

        <SingleSelect
          label="Format"
          value={format}                      // empty string -> shows placeholder
          onChange={setFormat}
          options={debateFormats}             // no empty option here
          placeholder="Select…"               // 👈 shows 'Select…' like persona fields
          required
        />
      </div>

      <div className="flex justify-end gap-3">
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
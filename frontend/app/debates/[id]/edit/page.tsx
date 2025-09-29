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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data?.error || "Failed to load");
    } catch {
      throw new Error(await res.text());
    }
  }
  return res.json();
};

export default function EditDebatePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const debateId = params?.id;

  const { data, error, isLoading } = useSWR(
    debateId ? `/api/debates/${debateId}` : null,
    fetcher
  );

  // Local form state
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<string>(""); // placeholder until data loads
  const [config, setConfig] = useState<any | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize state when data arrives
  useEffect(() => {
    if (!data) return;
    setTitle(data.title ?? "");
    setTopic(data.topic ?? "");
    setDescription(data.description ?? "");
    setFormat(data.format ?? ""); // if empty, placeholder shows
    setConfig(data.config ?? null);
  }, [data]);

  // When format changes, reset config to defaults (like Create page)
  useEffect(() => {
    if (isDebateFormat(format)) {
      // If format actually changed from the loaded value, apply defaults
      const originalFormat: string | undefined = data?.format;
      if (!originalFormat || originalFormat !== format) {
        setConfig(debateConfigDefaults[format]);
      }
    } else {
      setConfig(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  const header = useMemo(
    () => (
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Debate</h1>
      </div>
    ),
    []
  );

  async function handleSave() {
    try {
      setSaving(true);
      setSaveError(null);

      if (!debateId) throw new Error("Missing debate id");
      if (!title || !topic) throw new Error("Title and Topic are required");
      if (!isDebateFormat(format)) throw new Error("Please select a format");

      const res = await fetch(`/api/debates/${debateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic,
          description,
          format, // "structured" | "podcast"
          config, // defaults if format changed, otherwise existing
          // participants are edited elsewhere (not in this form)
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to update debate");

      router.push("/debates");
    } catch (e: any) {
      setSaveError(e.message || "Failed to update debate");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading debate…</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load debate.</p>
        <p className="mt-2 text-sm text-red-500">{String(error.message)}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-6">
        <p className="text-red-600">Debate not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {header}

      {saveError && <p className="text-red-600">{saveError}</p>}

      <div className="space-y-4">
        <TextField label="Title" value={title} onChange={setTitle} required />
        <TextField label="Topic" value={topic} onChange={setTopic} required />
        <TextAreaField label="Description" value={description} onChange={setDescription} rows={4} />

        <SingleSelect
          label="Format"
          value={format}                 // empty string -> shows placeholder
          onChange={setFormat}
          options={debateFormats}        // no empty option; uses placeholder
          placeholder="Select…"
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
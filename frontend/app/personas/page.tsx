"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { DeleteDialog } from "@/components/ui/DeleteDialog";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = "Failed to load";
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {
      msg = await res.text();
    }
    throw new Error(msg);
  }
  return res.json();
};

type Persona = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  shortBio?: string | null;
  expertise?: string[] | null;
  background?: string | null;
  language?: string | null;
  country?: string | null;
  speakingStyle?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  region?: string | null; // keep original structure if present
  voiceId?: string | null;
  ttsProvider?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  confidence?: number | null;
  verbosity?: number | null;
  tone?: string | null;
};

export default function PersonasPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/personas", fetcher);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [target, setTarget] = useState<Persona | null>(null);

  function requestDelete(p: Persona) {
    setTarget(p);
    setDeleteError(null);
    setConfirmOpen(true);
  }

  async function doDelete() {
    if (!target) return;
    try {
      setDeleting(true);
      setDeleteError(null);

      const res = await fetch(`/api/personas/${target.id}`, { method: "DELETE" });

      if (!res.ok) {
        // 💡 Read server message (e.g., 409 conflict with a clear explanation)
        let msg = "Failed to delete persona";
        try {
          const data = await res.json();
          msg = data?.error || msg;
        } catch {
          msg = await res.text();
        }
        throw new Error(msg);
      }

      setConfirmOpen(false);
      setTarget(null);
      await mutate();
    } catch (e: any) {
      setDeleteError(e?.message || "Failed to delete persona");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) return <div className="p-6">Loading personas…</div>;
  if (error)
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load personas.</p>
        <p className="mt-2 text-sm text-red-500">{String(error.message)}</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Personas</h1>
        <Link
          href="/persona/builder"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Create Persona
        </Link>
      </div>

      {(!data || data.length === 0) && (
        <p className="text-gray-600 dark:text-gray-400">No personas yet.</p>
      )}

      <ul className="divide-y divide-gray-200 dark:divide-white/10">
        {data?.map((p: Persona) => (
          <li key={p.id} className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                {p.shortBio ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{p.shortBio}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/personas/${p.id}/edit`}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-white dark:ring-white/10 dark:hover:bg-white/10"
              >
                Edit
              </Link>
              <button
                onClick={() => requestDelete(p)}
                className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 shadow-xs hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Confirm delete dialog (shared) */}
      <DeleteDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        entityName={target?.name || "this persona"}
        entityType="persona"
        isLoading={deleting}
      />

      {deleteError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
      )}
    </div>
  );
}
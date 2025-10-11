"use client";

import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
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

type Debate = {
  id: string;
  title: string;
  summary?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export default function DebatesPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/debates", fetcher);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [target, setTarget] = useState<Debate | null>(null);

  function requestDelete(d: Debate) {
    setTarget(d);
    setDeleteError(null);
    setConfirmOpen(true);
  }

  async function doDelete() {
    if (!target) return;
    try {
      setDeleting(true);
      setDeleteError(null);

      const res = await fetch(`/api/debates/${target.id}`, { method: "DELETE" });
      if (!res.ok) {
        let msg = "Failed to delete debate";
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
      setDeleteError(e?.message || "Failed to delete debate");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) return <div className="p-6">Loading debates…</div>;
  if (error)
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load debates.</p>
        <p className="mt-2 text-sm text-red-500">{String(error.message)}</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debates</h1>
        <Link
          href="/debates/create"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Create Debate
        </Link>
      </div>

      {(!data || data.length === 0) && (
        <p className="text-gray-600 dark:text-gray-400">No debates yet.</p>
      )}

      <ul className="divide-y divide-gray-200 dark:divide-white/10">
        {data?.map((d: Debate) => (
          <li key={d.id} className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{d.title}</p>
              {d.summary ? <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{d.summary}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/debates/${d.id}/edit`}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-900 dark:text-white dark:ring-white/10 dark:hover:bg-white/10"
              >
                Edit
              </Link>
              <button
                onClick={() => requestDelete(d)}
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
        entityName={target?.title || "this debate"}
        entityType="debate"
        isLoading={deleting}
      />

      {deleteError && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
      )}
    </div>
  );
}
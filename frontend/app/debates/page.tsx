"use client";

import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

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
  topic: string;
  description?: string | null;
  format: string;
  status: string;
};

export default function DebateListPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/debates", fetcher);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<Debate | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
          const j = await res.json();
          msg = j?.error || msg;
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
        {data?.map((debate: Debate) => (
          <li key={debate.id} className="flex items-center justify-between py-4">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">{debate.title}</h2>
              <p className="truncate text-sm text-gray-600 dark:text-gray-400">{debate.topic}</p>
              {debate.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {debate.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Format: {debate.format} · Status: {debate.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/debates/${debate.id}/edit`}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => requestDelete(debate)}
                className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Confirm delete dialog */}
      <Dialog open={confirmOpen} onClose={setConfirmOpen} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/40" />
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <div className="mx-auto mt-24 w-full max-w-lg">
            <DialogPanel className="rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:outline dark:-outline-offset-1 dark:outline-white/10">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete debate
              </DialogTitle>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{target?.title}</span>?
                This action is permanent and cannot be undone.
              </p>

              {deleteError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={doDelete}
                  disabled={deleting}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
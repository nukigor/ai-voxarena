"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
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

type Persona = {
  id: string;
  name: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  ageGroup?: string | null;
  genderIdentity?: string | null;
  temperament?: string | null;
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
      await mutate(); // refresh list
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white">
                  {p.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join("")}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</div>
                {p.nickname ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">“{p.nickname}”</div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/personas/${p.id}/edit`}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={() => requestDelete(p)}
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
                Delete persona
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-gray-900 dark:text-white">{target?.name}</span>?
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
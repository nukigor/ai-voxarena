"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { Persona, PersonaTaxonomy, Taxonomy } from "@prisma/client";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/components/ui/Pagination";

type PersonaWithTax = Persona & {
  taxonomies: (PersonaTaxonomy & { taxonomy: Taxonomy })[];
};

type PersonaRow = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  profession?: string | null;

  affiliation: {
    organization?: string | null;
    university?: string | null;
  };

  background: {
    culture?: string | null;
    ageGroup?: string | null;
    genderIdentity?: string | null;
  };

  traits: {
    archetypes: string[];
    temperament?: string | null;
    tone?: string | null;
  };

  communication: {
    confidence?: number | null; // 1–10
    verbosity?: string | null;  // Short/Medium/Long
    vocabularyStyle?: string | null;
    debateApproach?: string[] | null;
  };

  meta: {
    createdAt?: string | null; // ISO
    shortId: string;
  };
};

// ---- helpers to extract taxonomy terms
function firstTerm(p: PersonaWithTax, category: string): string | undefined {
  return p.taxonomies.find((t) => t.taxonomy.category === category)?.taxonomy.term;
}

function allTerms(p: PersonaWithTax, category: string): string[] {
  return p.taxonomies
    .filter((t) => t.taxonomy.category === category)
    .map((t) => t.taxonomy.term);
}

function shapeRow(p: PersonaWithTax): PersonaRow {
  const ageTx = firstTerm(p, "ageGroup");
  const genderTx = firstTerm(p, "genderIdentity");

  return {
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl ?? null,
    profession: p.profession ?? null,

    affiliation: {
      organization: firstTerm(p, "organization") ?? null,
      university: firstTerm(p, "university") ?? null,
    },

    background: {
      culture: firstTerm(p, "culture") ?? null,
      ageGroup: ageTx ?? p.ageGroup ?? null,
      genderIdentity: genderTx ?? p.genderIdentity ?? null,
    },

    traits: {
      archetypes: allTerms(p, "archetype"),
      temperament: p.temperament ?? null,
      tone: p.tone ?? null,
    },

    communication: {
      confidence: p.confidence ?? null,
      verbosity: p.verbosity ?? null,
      vocabularyStyle: p.vocabularyStyle ?? null,
      debateApproach: Array.isArray(p.debateApproach) ? p.debateApproach : null,
    },

    meta: {
      createdAt: p.createdAt?.toString() ?? null,
      shortId: p.id.slice(0, 8),
    },
  };
}

const PAGE_SIZE = 10;

export default function PersonasPage() {
  const [rows, setRows] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<PersonaRow | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/personas", { cache: "no-store" });
        const data: PersonaWithTax[] = await res.json();
        setRows(Array.isArray(data) ? data.map(shapeRow) : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [rows, page]);

  const empty = !loading && rows.length === 0;

  const total = rows.length;
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const pagedRows = rows.slice(startIdx, endIdx);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Personas</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Create, view, and manage AI personas for debates.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/persona/builder"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
          >
            + Create persona
          </Link>
        </div>
      </div>

      {/* table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
              <thead>
                <tr>
                  <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0 dark:text-white">
                    Identity
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Affiliation
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Background
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Traits
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Communication
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Meta
                  </th>
                  <th className="py-3.5 pr-4 pl-3 text-right sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-900">
                {loading && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                      Loading personas…
                    </td>
                  </tr>
                )}

                {empty && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                      No personas yet. Click “Create persona” to add your first one.
                    </td>
                  </tr>
                )}

                {pagedRows.map((p) => (
                  <tr key={p.id}>
                    {/* Identity */}
                    <td className="py-5 pr-3 pl-4 text-sm whitespace-nowrap sm:pl-0">
                      <div className="flex items-center">
                        <div className="size-11 shrink-0">
                          <Avatar name={p.name} src={p.avatarUrl ?? undefined} size="sm" />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            <Link href={`/personas/${p.id}/edit`} className="hover:underline">
                              {p.name}
                            </Link>
                          </div>
                          <div className="mt-1 text-gray-500 dark:text-gray-400">
                            {p.profession ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Affiliation */}
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <div className="text-gray-900 dark:text-white">
                        {p.affiliation.organization ?? "—"}
                      </div>
                      <div className="mt-1">{p.affiliation.university ?? "—"}</div>
                    </td>

                    {/* Background */}
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <div className="text-gray-900 dark:text-white">
                        {p.background.culture ?? "—"}
                      </div>
                      <div className="mt-1">
                        {(p.background.ageGroup ?? "—") + " · " + (p.background.genderIdentity ?? "—")}
                      </div>
                    </td>

                    {/* Traits */}
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {p.traits.archetypes.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200"
                          >
                            {t}
                          </span>
                        ))}
                        {p.traits.archetypes.length > 2 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            +{p.traits.archetypes.length - 2}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        {(p.traits.temperament ?? p.traits.tone ?? "—")}
                      </div>
                    </td>

                    {/* Communication */}
                    <td
                      className="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
                      title={[
                        p.communication.vocabularyStyle && `Vocab: ${p.communication.vocabularyStyle}`,
                        p.communication.debateApproach?.length
                          ? `Approach: ${p.communication.debateApproach.join(", ")}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    >
                      <div className="text-gray-900 dark:text-white">
                        {typeof p.communication.confidence === "number"
                          ? `Confidence ${p.communication.confidence}/10`
                          : "—"}
                      </div>
                      <div className="mt-1">
                        {p.communication.verbosity ?? "—"}
                      </div>
                    </td>

                    {/* Meta */}
                    <td className="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <div className="text-gray-900 dark:text-white">
                        {p.meta.createdAt
                          ? new Date(p.meta.createdAt).toLocaleDateString()
                          : "—"}
                      </div>
                      <div className="mt-1" title={p.id}>
                        #{p.meta.shortId}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-5 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                      <div className="inline-flex gap-3">
                        <Link
                          href={`/personas/${p.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit<span className="sr-only">, {p.name}</span>
                        </Link>
                        <button
                          onClick={() => setToDelete(p)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete<span className="sr-only">, {p.name}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gray-900/5 dark:bg-white/10" />
            <Pagination
              page={page}
              total={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <DeleteDialog
        open={!!toDelete}
        entityName={toDelete?.name ?? ""}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const res = await fetch(`/api/personas/${toDelete.id}`, { method: "DELETE" });
          if (res.ok) {
            setRows((xs) => xs.filter((x) => x.id !== toDelete.id));
            setToDelete(null);
          } else {
            alert("Failed to delete persona");
          }
        }}
      />
    </div>
  );
}

/** Inline reusable delete dialog (Tailwind Plus + Headless UI) */
function DeleteDialog({
  open,
  onClose,
  onConfirm,
  entityName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0
                   data-enter:duration-300 data-enter:ease-out
                   data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/50"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all
                       data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out
                       data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg
                       data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800
                       dark:outline dark:-outline-offset-1 dark:outline-white/10"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10 dark:bg-red-500/10">
                  <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                    Delete persona
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete <span className="font-semibold">{entityName}</span>? This action
                      is permanent and cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-700/25">
              <button
                type="button"
                onClick={onConfirm}
                className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto dark:bg-red-500 dark:shadow-none dark:hover:bg-red-400"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
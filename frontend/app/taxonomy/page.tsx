"use client";

import * as React from "react";
import SingleSelect from "@/components/ui/forms/SingleSelect";
import { Pagination } from "@/components/ui/Pagination"; // ⟵ changed to named import
import Link from "next/link";

type CategoryOption = { value: string; label: string };

type Term = {
  id: string;
  term: string;
  slug: string | null;
  isActive: boolean;
  description: string;
  createdAt: string; // ISO
};

type TermsResponse = {
  items: Term[];
  total: number;
  page: number;
  pageSize: number;
};

async function fetchCategories(): Promise<string[]> {
  const res = await fetch("/api/taxonomy/categories", { cache: "no-store" });
  if (!res.ok) return [];
  return await res.json();
}

async function fetchTerms(category: string, page: number, pageSize: number): Promise<TermsResponse> {
  const params = new URLSearchParams({ category, page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`/api/taxonomy/terms?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    return { items: [], total: 0, page, pageSize };
  }
  return await res.json();
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function TaxonomyPage() {
  const [categoryOptions, setCategoryOptions] = React.useState<CategoryOption[]>([]);
  const [category, setCategory] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);
  const [pageSize] = React.useState<number>(20); // requirement: 20 per page

  const [data, setData] = React.useState<TermsResponse>({ items: [], total: 0, page: 1, pageSize });
  const [loading, setLoading] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [expandedDesc, setExpandedDesc] = React.useState<Set<string>>(new Set()); // which rows show full description

  // Load categories once
  React.useEffect(() => {
    let active = true;
    fetchCategories().then((cats) => {
      if (!active) return;
      const opts = cats.map((c) => ({ value: c, label: c })).sort((a, b) => a.label.localeCompare(b.label));
      setCategoryOptions(opts);
    });
    return () => {
      active = false;
    };
  }, []);

  // When category or page changes, load terms
  React.useEffect(() => {
    if (!category) {
      setData({ items: [], total: 0, page: 1, pageSize });
      setSelectedIds(new Set());
      return;
    }
    setLoading(true);
    fetchTerms(category, page, pageSize)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [category, page, pageSize]);

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleDescription(id: string) {
    setExpandedDesc((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Reset page when category changes
  function handleCategoryChange(val: string | null) {
    setCategory(val);
    setPage(1);
    setSelectedIds(new Set());
  }

  const deleteDisabled = selectedIds.size === 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Taxonomy</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Select a category to view and manage taxonomy terms.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex gap-2">
          <button
            type="button"
            disabled={deleteDisabled}
            className="block rounded-md bg-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700 shadow-xs disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200"
            title={deleteDisabled ? "Select one or more terms to enable" : "Delete selected"}
          >
            Delete
          </button>
          <button
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
          >
            Add term
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="mt-6 max-w-md">
        <SingleSelect
          label="Category"
          options={categoryOptions}
          value={category}
          placeholder="Filter by category"
          onChange={handleCategoryChange}
          allowUnselect={true}
        />
      </div>

      {/* Table */}
      {category && (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-sm outline-1 outline-black/5 sm:rounded-lg dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
                <table className="relative min-w-full divide-y divide-gray-300 dark:divide-white/15">
                  <thead className="bg-gray-50 dark:bg-gray-800/75">
                    <tr>
                      <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6 dark:text-gray-200">
                        <input
                          aria-label="Select all"
                          type="checkbox"
                          className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-800 dark:border-gray-600"
                          onChange={(e) => {
                            const checked = e.currentTarget.checked;
                            if (checked) {
                              setSelectedIds(new Set(data.items.map((x) => x.id)));
                            } else {
                              setSelectedIds(new Set());
                            }
                          }}
                          checked={data.items.length > 0 && selectedIds.size === data.items.length}
                        />
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Term
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Slug
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Active
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Description
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                        Created at
                      </th>
                      <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-6">
                        <span className="sr-only">Edit</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-gray-800/50">
                    {loading && (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          Loading…
                        </td>
                      </tr>
                    )}
                    {!loading && data.items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          No terms found in “{category}”.
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      data.items.map((item) => {
                        const isChecked = selectedIds.has(item.id);
                        const isExpanded = expandedDesc.has(item.id);
                        const short = item.description?.slice(0, 100) ?? "";
                        const needsMore = (item.description?.length ?? 0) > 100;
                        return (
                          <tr key={item.id}>
                            <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-6 dark:text-white">
                              <input
                                type="checkbox"
                                className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-800 dark:border-gray-600"
                                checked={isChecked}
                                onChange={(e) => toggleRow(item.id, e.currentTarget.checked)}
                              />
                            </td>
                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-700 dark:text-gray-200">
                              {item.term}
                            </td>
                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {item.slug ?? "—"}
                            </td>
                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {item.isActive ? "Yes" : "No"}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {isExpanded ? (
                                <>
                                  {item.description || "—"}{" "}
                                  {needsMore && (
                                    <button
                                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                      onClick={() => toggleDescription(item.id)}
                                    >
                                      show less
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {short || "—"}
                                  {needsMore && (
                                    <>
                                      {"… "}
                                      <button
                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                        onClick={() => toggleDescription(item.id)}
                                      >
                                        more
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </td>
                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {fmtDate(item.createdAt)}
                            </td>
                            <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                              <Link
                                href={`/taxonomy/${item.id}/edit`}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                Edit<span className="sr-only">, {item.term}</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {data.total > pageSize && (
            <div className="mt-4">
              <Pagination
                page={page}
                total={data.total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
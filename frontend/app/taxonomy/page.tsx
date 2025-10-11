"use client";

import * as React from "react";
import SingleSelect from "@/components/ui/forms/SingleSelect";
import { Pagination } from "@/components/ui/Pagination";
import TaxonomyTabs from "@/components/taxonomy/TaxonomyTabs";
import { DeleteDialog } from "@/components/ui/DeleteDialog";
import TaxonomyCategorySelect from "@/components/ui/forms/TaxonomyCategorySelect";

type CategoryOption = { value: string; label: string };

type Term = {
  id: string;
  term: string;
  slug: string | null;       // not displayed
  isActive: boolean;
  description: string;
  category: string;          // ensured client-side
  createdAt: string;         // ISO
  updatedAt: string;         // ISO
};

type TermsResponse = {
  items: Term[];
  total: number;
  page: number;
  pageSize: number;
};

// Existing categories for filter (strings)
async function fetchFilterCategories(): Promise<string[]> {
  const res = await fetch("/api/taxonomy/categories", { cache: "no-store" });
  if (!res.ok) return [];
  return await res.json();
}

// Terms WITH category filter (uses backend pagination)
async function fetchTermsForCategory(
  category: string,
  page: number,
  pageSize: number
): Promise<TermsResponse> {
  const params = new URLSearchParams({
    category,
    page: String(page),
    pageSize: String(pageSize),
  });

  const res = await fetch(`/api/taxonomy/terms?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { items: [], total: 0, page, pageSize };
  }

  const data = await res.json();
  // Ensure category field is present
  const items = (data.items || []).map((t: any) => ({ ...t, category }));
  return { ...data, items };
}

// Fetch ALL terms by combining per-category results client-side
async function fetchAllTermsClientSide(
  categories: string[],
  page: number,
  pageSize: number
): Promise<TermsResponse> {
  if (categories.length === 0) {
    return { items: [], total: 0, page, pageSize };
  }

  // Fetch each category’s terms with a large pageSize (client-side pagination later)
  const perCategoryFetches = categories.map((cat) =>
    fetchTermsForCategory(cat, 1, 1000) // adjust if a category can exceed 1000 terms
  );

  const results = await Promise.all(perCategoryFetches);
  const combined: Term[] = results.flatMap((r) => r.items || []);

  // Sort by term asc to mimic server sort
  combined.sort((a, b) => a.term.localeCompare(b.term));

  const total = combined.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = combined.slice(start, end);

  return { items, total, page, pageSize };
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
  // Top filter categories (strings coming from existing API)
  const [filterOptions, setFilterOptions] = React.useState<CategoryOption[]>([]);

  // Default: no category selected -> list ALL terms
  const [category, setCategory] = React.useState<string | null>(null);

  const [page, setPage] = React.useState<number>(1);
  const [pageSize] = React.useState<number>(20);

  const [data, setData] = React.useState<TermsResponse>({
    items: [],
    total: 0,
    page: 1,
    pageSize,
  });
  const [loading, setLoading] = React.useState(false);

  // selection state
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [expandedDesc, setExpandedDesc] = React.useState<Set<string>>(new Set());

  // delete dialog state
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteNames, setDeleteNames] = React.useState<string>("");
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);

  // add/edit modal state
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [formLoading, setFormLoading] = React.useState(false);

  // shared form fields (add/edit)
  const [fId, setFId] = React.useState<string | null>(null);
  const [fTerm, setFTerm] = React.useState("");
  const [fDescription, setFDescription] = React.useState("");
  const [fActive, setFActive] = React.useState(true);
  const [fCategory, setFCategory] = React.useState<string>(""); // Add via TaxonomyCategorySelect; Edit read-only display

  // Load filter options (strings) for top dropdown
  React.useEffect(() => {
    let active = true;

    fetchFilterCategories().then((cats) => {
      if (!active) return;
      const opts = cats.map((c) => ({ value: c, label: c })) as CategoryOption[];
      setFilterOptions(opts);
    });

    return () => {
      active = false;
    };
  }, []);

  // Load terms whenever category/page changes
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setSelectedIds(new Set());

      try {
        if (category) {
          const res = await fetchTermsForCategory(category, page, pageSize);
          if (!cancelled) setData(res);
        } else {
          // List ALL terms by aggregating each category client-side
          const cats =
            filterOptions.length > 0
              ? filterOptions.map((o) => o.value)
              : await fetchFilterCategories();

          const res = await fetchAllTermsClientSide(cats, page, pageSize);
          if (!cancelled) setData(res);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [category, page, pageSize, filterOptions]);

  function resetSelection() {
    setSelectedIds(new Set());
  }

  function handleCategoryChange(val: string | null) {
    setCategory(val); // null means "All"
    setPage(1);
    resetSelection();
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  // ---------- Delete flow ----------
  function openRowDeleteDialog(item: Term) {
    setDeleteOpen(true);
    setDeleteIds([item.id]);
    setDeleteNames(item.term);
  }

  function openBulkDeleteDialog() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const names = data.items
      .filter((x) => ids.includes(x.id))
      .map((x) => x.term)
      .join('", "');
    setDeleteIds(ids);
    setDeleteNames(ids.length === 1 ? names : `"${names}"`);
    setDeleteOpen(true);
  }

  async function doDelete() {
    setDeleteOpen(false);
    if (deleteIds.length === 0) return;

    for (const id of deleteIds) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(`/api/taxonomy/terms/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Delete failed");
        return;
      }
    }
    resetSelection();
    setLoading(true);
    const res = category
      ? await fetchTermsForCategory(category, page, pageSize)
      : await fetchAllTermsClientSide(
          filterOptions.map((o) => o.value),
          page,
          pageSize
        );
    setData(res);
    setLoading(false);
  }

  // ---------- Add/Edit flow ----------
  function openAddModal() {
    setFId(null);
    setFTerm("");
    setFDescription("");
    setFActive(true);
    setFCategory(""); // require user selection via TaxonomyCategorySelect
    setAddOpen(true);
  }

  function openEditModal(item: Term) {
    setFId(item.id);
    setFTerm(item.term);
    setFDescription(item.description || "");
    setFActive(!!item.isActive);
    setFCategory(item.category); // shown read-only
    setEditOpen(true);
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!fCategory) {
      alert("Please select a category.");
      return;
    }
    setFormLoading(true);
    const payload = {
      term: fTerm,
      description: fDescription,
      isActive: fActive,
      category: fCategory, // full category name selected
    };
    const res = await fetch("/api/taxonomy/terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setFormLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Save failed");
      return;
    }
    setAddOpen(false);

    // refresh
    setLoading(true);
    const refreshed = category
      ? await fetchTermsForCategory(category, page, pageSize)
      : await fetchAllTermsClientSide(
          filterOptions.map((o) => o.value),
          page,
          pageSize
        );
    setData(refreshed);
    setLoading(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!fId) return;
    setFormLoading(true);
    const payload = {
      term: fTerm,
      description: fDescription,
      isActive: fActive,
      // category is immutable on edit
    };
    const res = await fetch(`/api/taxonomy/terms/${fId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setFormLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Save failed");
      return;
    }
    setEditOpen(false);

    // refresh
    setLoading(true);
    const refreshed = category
      ? await fetchTermsForCategory(category, page, pageSize)
      : await fetchAllTermsClientSide(
          filterOptions.map((o) => o.value),
          page,
          pageSize
        );
    setData(refreshed);
    setLoading(false);
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="p-6">
      {/* Heading (per your spec) */}
      <div className="md:flex md:items-center md:justify-between mb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-white">
            Taxonomy management
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <TaxonomyTabs />

      {/* Filter: default none selected -> list all terms */}
      <div className="mt-6 max-w-md">
        <SingleSelect
          label="Category"
          options={filterOptions}
          value={category}
          placeholder="All categories"
          onChange={handleCategoryChange}
          allowUnselect={true}
        />
      </div>

      {/* Toolbar (right aligned) */}
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Add
        </button>

        {/* When enabled, match red bordered / red label like row Delete */}
        <button
          type="button"
          onClick={openBulkDeleteDialog}
          disabled={!hasSelection}
          className={
            hasSelection
              ? "inline-flex items-center rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-950/20"
              : "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 bg-white text-gray-900 inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20 disabled:hover:bg-transparent"
          }
        >
          Delete
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-md border border-gray-200 shadow dark:border-white/10">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="py-3 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:pl-6">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Term
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Description
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                    <th className="py-3 pr-4 pl-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:pr-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-white/10 dark:bg-transparent">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  )}
                  {!loading && data.items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-gray-500">
                        No terms found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    data.items.map((item) => {
                      const isChecked = selectedIds.has(item.id);
                      const isExpanded = expandedDesc.has(item.id);
                      const preview = item.description?.slice(0, 140) ?? "";
                      const showToggle =
                        item.description && item.description.length > 140;

                      return (
                        <tr key={item.id}>
                          {/* checkbox */}
                          <td className="py-4 pl-4 pr-3 sm:pl-6">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={isChecked}
                              aria-label={`Select ${item.term}`}
                              onChange={() => toggleRow(item.id)}
                            />
                          </td>

                          {/* term (slug removed) */}
                          <td className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.term}
                            {!item.isActive && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                inactive
                              </span>
                            )}
                          </td>

                          {/* description */}
                          <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {isExpanded ? (
                              <div className="space-y-1">
                                <div className="whitespace-pre-wrap">
                                  {item.description || "—"}
                                </div>
                                {showToggle && (
                                  <button
                                    type="button"
                                    onClick={() => toggleDescription(item.id)}
                                    className="text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Show less
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                <span className="whitespace-pre-wrap">
                                  {preview || "—"}
                                  {showToggle ? "…" : ""}
                                </span>
                                {showToggle && (
                                  <button
                                    type="button"
                                    onClick={() => toggleDescription(item.id)}
                                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Show more
                                  </button>
                                )}
                              </>
                            )}
                          </td>

                          {/* created */}
                          <td className="px-3 py-4 text-right text-sm text-gray-500 dark:text-gray-400">
                            {fmtDate(item.createdAt)}
                          </td>

                          {/* actions: Edit + Delete buttons */}
                          <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6">
                            <button
                              onClick={() => openEditModal(item)}
                              className="mr-2 rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 dark:border-white/20 dark:hover:bg-white/5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openRowDeleteDialog(item)}
                              className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-950/20"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
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
        </div>
      </div>

      {/* Delete dialog (shared component) */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doDelete}
        entityName={deleteNames || "term(s)"}
        entityType="taxonomy term"
      />

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => !formLoading && setAddOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900 dark:text-white">
              <h3 className="text-base font-semibold leading-7">Add term</h3>
              <form onSubmit={submitAdd} className="mt-4 space-y-4">
                {/* Category select (uses new TaxonomyCategorySelect) */}
                <TaxonomyCategorySelect
                  value={fCategory}
                  onChange={setFCategory}
                  placeholder="Select a category"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Term
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                    value={fTerm}
                    onChange={(e) => setFTerm(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                    rows={4}
                    value={fDescription}
                    onChange={(e) => setFDescription(e.target.value)}
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={fActive}
                    onChange={(e) => setFActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Active
                </label>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => !formLoading && setAddOpen(false)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-white/20 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40"
            aria-hidden="true"
            onClick={() => !formLoading && setEditOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900 dark:text-white">
              <h3 className="text-base font-semibold leading-7">Edit term</h3>
              <form onSubmit={submitEdit} className="mt-4 space-y-4">
                {/* Category (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <div className="mt-1 block w-full rounded-md border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:text-gray-300">
                    {fCategory || "—"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Term
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                    value={fTerm}
                    onChange={(e) => setFTerm(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
                    rows={4}
                    value={fDescription}
                    onChange={(e) => setFDescription(e.target.value)}
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={fActive}
                    onChange={(e) => setFActive(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Active
                </label>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => !formLoading && setEditOpen(false)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-white/20 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Save changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
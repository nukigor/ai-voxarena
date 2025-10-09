"use client";

import * as React from "react";
import TaxonomyTabs from "@/components/taxonomy/TaxonomyTabs";

type Category = {
  id: string;
  key: string | null;         // schema has `key`
  fullName: string;           // schema has `fullName`
  description: string | null;
  createdAt: string;          // ISO
  updatedAt: string;          // ISO
};

type ListResponse = {
  items: Category[];
  total: number;
  page: number;
  pageSize: number;
};

const PAGE_SIZE = 10;

export default function TaxonomyCategoriesPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Category[]>([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  // form state for create/edit
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [key, setKey] = React.useState("");
  const [description, setDescription] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      const res = await fetch(`/api/taxonomycategories?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load categories");
      const data: ListResponse = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setFullName("");
    setKey("");
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { fullName, description, key: key || undefined };
    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/taxonomycategories/${editingId}` : "/api/taxonomycategories";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Save failed");
      return;
    }
    resetForm();
    await load();
  }

  function handleEdit(item: Category) {
    setEditingId(item.id);
    setFullName(item.fullName);
    setKey(item.key || "");
    setDescription(item.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    const res = await fetch(`/api/taxonomycategories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delete failed");
      return;
    }
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

      {/* Create / Edit form */}
      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl rounded-lg border border-gray-200 p-4 shadow-sm dark:border-white/10">
        <h3 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
          {editingId ? "Edit category" : "Create a new category"}
        </h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full name
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Rhetorical Style"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Key (optional — will be auto-generated if left blank)
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg:white/5 dark:text-gray-100"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g., rhetorical-style"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full description
            </label>
            <textarea
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this category covers and how it's used."
              rows={4}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {editingId ? "Save changes" : "Create category"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="mt-8">
        <div className="overflow-hidden rounded-md border border-gray-200 shadow dark:border-white/10">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Full name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10 bg-white dark:bg-transparent">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-500">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-red-600">{error}</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-gray-500">No categories yet.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 align-top text-sm font-medium text-gray-900 dark:text-gray-100">{item.fullName}</td>
                    <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300">{item.key || "—"}</td>
                    <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300">{item.description || "—"}</td>
                    <td className="px-4 py-3 align-top text-right text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 align-top text-right text-sm">
                      <button
                        onClick={() => handleEdit(item)}
                        className="mr-3 rounded-md border border-gray-300 px-2 py-1 text-sm hover:bg-gray-50 dark:border-white/20 dark:hover:bg-white/5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-950/20"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <div>
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/5"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-gray-300 px-2 py-1 hover:bg-gray-50 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/5"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
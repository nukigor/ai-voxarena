"use client";

import Link from "next/link";
import useSWR from "swr";

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
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
};

export default function DebateListPage() {
  const { data, error, isLoading } = useSWR("/api/debates", fetcher);

  if (isLoading) {
    return <div className="p-6">Loading debates…</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load debates.</p>
        <p className="mt-2 text-sm text-red-500">{String(error.message)}</p>
      </div>
    );
  }

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
        {data?.map((debate: any) => (
          <li key={debate.id} className="flex items-center justify-between py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{debate.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{debate.topic}</p>
              {debate.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
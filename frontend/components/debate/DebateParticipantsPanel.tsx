"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { SingleSelect } from "@/components/ui/forms/SingleSelect";
import { roleOptionsForFormat, type DebateRole } from "@/lib/debateRoles";
import { TrashIcon } from "@heroicons/react/24/outline";

type PersonaLite = {
  id: string;
  name: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  debateApproach?: string[]; // badges
  temperament?: string | null; // badge
  conflictStyle?: string | null; // badge
  vocabularyStyle?: string | null; // badge
};

export type DebateParticipantDraft = {
  personaId: string;
  role: DebateRole | "";
  order: number;
  persona?: PersonaLite; // convenience for display
};

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white">
      {initials || "?"}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
      {children}
    </span>
  );
}

function PersonaCard({
  item,
  format,
  onRoleChange,
  onRemove,
}: {
  item: DebateParticipantDraft;
  format?: string;
  onRoleChange: (role: DebateRole) => void;
  onRemove: () => void;
}) {
  const p = item.persona!;
  const roleOpts = roleOptionsForFormat(format);

  return (
    <div className="rounded-xl border border-gray-200 p-4 shadow-xs dark:border-white/10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt={p.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <InitialsAvatar name={p.name} />
          )}
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{p.name}</div>
            {p.nickname && (
              <div className="text-xs text-gray-500 dark:text-gray-400">“{p.nickname}”</div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Remove"
          title="Remove"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(p.debateApproach || []).slice(0, 4).map((a) => (
          <Badge key={a}>{a}</Badge>
        ))}
        {p.temperament ? <Badge>{p.temperament}</Badge> : null}
        {p.conflictStyle ? <Badge>{p.conflictStyle}</Badge> : null}
        {p.vocabularyStyle ? <Badge>{p.vocabularyStyle}</Badge> : null}
      </div>

      <div className="mt-4">
        <SingleSelect
          label="Role"
          value={item.role}
          onChange={(v: string) => onRoleChange((v as DebateRole) || "DEBATER")}
          options={roleOpts}
          placeholder="Select…"
          required
        />
      </div>
    </div>
  );
}

function usePersonasList() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<PersonaLite[]>([]);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/personas");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load personas");
      const mapped: PersonaLite[] = (json || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        avatarUrl: p.avatarUrl,
        debateApproach: p.debateApproach || [],
        temperament: p.temperament || null,
        conflictStyle: p.conflictStyle || null,
        vocabularyStyle: p.vocabularyStyle || null,
      }));
      setItems(mapped);
    } catch (e: any) {
      setError(e.message || "Failed to load personas");
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, items, load };
}

function SelectPersonaModal({
  open,
  onClose,
  onPick,
  existingIds,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (p: PersonaLite) => void;
  existingIds: string[];
}) {
  const { items, load, loading, error } = usePersonasList();
  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="mx-auto mt-20 w-full max-w-2xl">
          <DialogPanel className="rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Select persona
            </DialogTitle>

            {loading ? (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading…</p>
            ) : error ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {items.map((p) => {
                  const disabled = existingIds.includes(p.id);
                  return (
                    <li
                      key={p.id}
                      className="rounded-lg border border-gray-200 p-3 dark:border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        {p.avatarUrl ? (
                          <img
                            src={p.avatarUrl}
                            alt={p.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
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
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {p.name}
                          </div>
                          {p.nickname && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              “{p.nickname}”
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1">
                        {(p.debateApproach || []).slice(0, 3).map((a) => (
                          <Badge key={a}>{a}</Badge>
                        ))}
                      </div>

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            onPick(p);
                            onClose();
                          }}
                          disabled={disabled}
                          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                        >
                          {disabled ? "Already added" : "Add"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}

export default function DebateParticipantsPanel({
  format,
  participants,
  setParticipants,
}: {
  format?: string;
  participants: DebateParticipantDraft[];
  setParticipants: (fn: (prev: DebateParticipantDraft[]) => DebateParticipantDraft[]) => void;
}) {
  const router = useRouter();
  const [selectOpen, setSelectOpen] = React.useState(false);

  function addPersona(p: PersonaLite) {
    setParticipants((prev) => [
      ...prev,
      {
        personaId: p.id,
        role: "" as DebateRole | "",
        order: prev.length,
        persona: p,
      },
    ]);
  }

  function removeAt(idx: number) {
    setParticipants((prev) => prev.filter((_, i) => i !== idx).map((x, i) => ({ ...x, order: i })));
  }

  function updateRole(idx: number, role: DebateRole) {
    setParticipants((prev) => prev.map((x, i) => (i === idx ? { ...x, role } : x)));
  }

  return (
    <div className="rounded-xl border border-gray-200 p-5 shadow-xs dark:border-white/10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage debate personas</h2>

      <div className="mt-4 space-y-4">
        {participants.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No personas added yet. Create a new persona or select an existing one.
          </p>
        )}

        {participants.map((pt, idx) => (
          <PersonaCard
            key={`${pt.personaId}-${idx}`}
            item={pt}
            format={format}
            onRoleChange={(r) => updateRole(idx, r)}
            onRemove={() => removeAt(idx)}
          />
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/persona/builder")}
          className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          Create persona
        </button>
        <button
          type="button"
          onClick={() => setSelectOpen(true)}
          className="flex-1 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          Select persona
        </button>
      </div>

      <SelectPersonaModal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        onPick={addPersona}
        existingIds={participants.map((p) => p.personaId)}
      />
    </div>
  );
}
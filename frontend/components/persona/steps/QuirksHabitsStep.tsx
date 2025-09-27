"use client";

import * as React from "react";
import { TextAreaField } from "@/components/ui/forms/TextAreaField";
import { MultiSelect, type Option } from "@/components/ui/forms/MultiSelect";

type Taxo = { id: string; term: string; category: string };

async function fetchTaxonomy(cat: string): Promise<Taxo[]> {
  const res = await fetch(`/api/taxonomy?category=${encodeURIComponent(cat)}`, { cache: "no-store" });
  if (!res.ok) return [];
  return await res.json();
}

function toOptions(xs: Taxo[]): Option[] {
  return xs.map((t) => ({ id: t.id, label: t.term }));
}

export default function QuirksHabitsStep({
  data,
  setData,
  onValidityChange,
  showErrors,
}: {
  data: any;
  setData: (updater: (prev: any) => any) => void;
  onValidityChange?: (ok: boolean) => void;
  showErrors?: boolean;
}) {
  // optional step → always valid
  React.useEffect(() => {
    onValidityChange?.(true);
  }, [onValidityChange]);

  const [filler, setFiller] = React.useState<Taxo[]>([]);
  const [metaphors, setMetaphors] = React.useState<Taxo[]>([]);
  const [habits, setHabits] = React.useState<Taxo[]>([]);

  React.useEffect(() => {
    (async () => {
      const [f, m, h] = await Promise.all([
        fetchTaxonomy("fillerPhrase"),
        fetchTaxonomy("metaphor"),
        fetchTaxonomy("debateHabit"),
      ]);
      setFiller(f || []);
      setMetaphors(m || []);
      setHabits(h || []);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quirks & Habits</h3>

        {/* Quirks (free text, optional) */}
        <TextAreaField
          id="quirks"
          label="Quirks"
          placeholder='e.g., "Taps pen when thinking", "Always rearranges notes"'
          value={(data.quirksText as string) ?? ""}
          onChange={(v) => setData((p: any) => ({ ...p, quirksText: v }))}
          rows={3}
        />

        {/* Filler phrases (taxonomy, multi, optional) */}
        <MultiSelect
          label="Filler phrases"
          options={toOptions(filler)}
          valueIds={(data.fillerPhraseIds as string[]) ?? []}
          onChangeIds={(ids) => setData((p: any) => ({ ...p, fillerPhraseIds: ids }))}
          placeholder='e.g., "You know?", "Basically…", "Like…"'
        />

        {/* Preferred metaphors (taxonomy, multi, optional) */}
        <MultiSelect
          label="Preferred metaphors"
          options={toOptions(metaphors)}
          valueIds={(data.metaphorIds as string[]) ?? []}
          onChangeIds={(ids) => setData((p: any) => ({ ...p, metaphorIds: ids }))}
          placeholder='e.g., Sports, Food, Nature, History, Technology, War/Conflict'
        />

        {/* Debate habits (taxonomy, multi, optional) */}
        <MultiSelect
          label="Debate habits"
          options={toOptions(habits)}
          valueIds={(data.debateHabitIds as string[]) ?? []}
          onChangeIds={(ids) => setData((p: any) => ({ ...p, debateHabitIds: ids }))}
          placeholder="e.g., Always cites data, Uses sarcasm, Frames as questions"
        />
      </section>
    </div>
  );
}
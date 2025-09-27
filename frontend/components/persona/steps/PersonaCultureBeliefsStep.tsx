"use client";

import * as React from "react";
import { SliderField } from "@/components/ui/forms/SliderField";
import { MultiSelect, type Option } from "@/components/ui/forms/MultiSelect";
import { SingleSelect } from "@/components/ui/forms/SingleSelect";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";
import { TEMPERAMENT_OPTIONS } from "@/lib/personaOptions";
import { TaxonomySelect } from "@/components/ui/forms/TaxonomySelect";

type Taxo = { id: string; term: string; category: string };

async function fetchTaxonomy(cat: string): Promise<Taxo[]> {
  const res = await fetch(`/api/taxonomy?category=${encodeURIComponent(cat)}`, { cache: "no-store" });
  if (!res.ok) return [];
  return await res.json();
}

function toOptions(xs: Taxo[]): Option[] {
  return xs.map((t) => ({ id: t.id, label: t.term }));
}

export default function PersonaCultureBeliefsStep({
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
  // Multi-select taxonomies we still need to fetch for options:
  const [arch, setArch] = React.useState<Taxo[]>([]);
  const [philosophy, setPhilosophy] = React.useState<Taxo[]>([]);

  React.useEffect(() => {
    (async () => {
      const [a, ph] = await Promise.all([fetchTaxonomy("archetype"), fetchTaxonomy("philosophy")]);
      setArch(a || []);
      setPhilosophy(ph || []);
    })();
  }, []);

  // 👉 Default Confidence to 5 if not set; use this derived value everywhere
  const confidence = typeof data.confidence === "number" ? data.confidence : 5;

  // 👉 Optional: persist default 5 into state so it’s saved consistently
  React.useEffect(() => {
    setData((p: any) => (typeof p.confidence === "number" ? p : { ...p, confidence: 5 }));
  }, [setData]);

  // Required fields: archetypes>=1, temperament, confidence(0–10), cultureId, communityTypeId
  const valid =
    (Array.isArray(data.archetypeIds) && data.archetypeIds.length > 0) &&
    !!data.temperament &&
    typeof confidence === "number" &&
    confidence >= 0 &&
    confidence <= 10 &&
    !!data.cultureId &&
    !!data.communityTypeId;

  React.useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  return (
    <div className="space-y-8">
      {/* Personality */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Personality</h3>

        <MultiSelect
          label="Archetypes"
          options={toOptions(arch)}
          valueIds={data.archetypeIds ?? []}
          onChangeIds={(ids) => setData((p: any) => ({ ...p, archetypeIds: ids }))}
          required
          error={
            showErrors && (!Array.isArray(data.archetypeIds) || data.archetypeIds.length === 0)
              ? "Select at least one archetype."
              : undefined
          }
        />

        <SingleSelect
          label={
            <>
              Temperament <span className="text-red-600">*</span>
            </>
          }
          placeholder="Select…"
          value={data?.temperament ?? null}
          onChange={(v) => setData((p: any) => ({ ...p, temperament: v }))}
          options={TEMPERAMENT_OPTIONS}
          error={showErrors && !data?.temperament ? "Temperament is required." : undefined}
        />

        <SliderField
          label="Confidence"
          labels={["Shy", "Neutral", "Confident"]}
          value={confidence}
          onChange={(v) => setData((p: any) => ({ ...p, confidence: v }))}
          min={0}
          max={10}
          required
        />
        {showErrors &&
          !(typeof confidence === "number" && confidence >= 0 && confidence <= 10) && (
            <p className="text-sm text-red-600 dark:text-red-400">Confidence is required.</p>
          )}
      </section>

      {/* Cultural Background */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Cultural Background</h3>

        {/* Single-select taxonomy */}
        <TaxonomySelect
          category="culture"
          label="Region / Culture"
          valueId={data.cultureId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, cultureId: id }))}
          required
          placeholder="Search or select a culture…"
          error={showErrors && !data.cultureId ? "Culture is required." : undefined}
        />

        {/* Single-select taxonomy */}
        <TaxonomySelect
          category="communityType"
          label="Community type"
          valueId={data.communityTypeId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, communityTypeId: id }))}
          required
          placeholder="Search or select a community type…"
          error={showErrors && !data.communityTypeId ? "Community type is required." : undefined}
        />
      </section>

      {/* Beliefs & Worldview */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Beliefs & Worldview</h3>

        {/* Single-select taxonomy (per your latest direction) */}
        <TaxonomySelect
          category="political"
          label="Political orientation"
          valueId={data.politicalId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, politicalId: id }))}
          placeholder="Search or select political orientation…"
        />

        {/* Single-select taxonomy */}
        <TaxonomySelect
          category="religion"
          label="Religion / Spirituality"
          valueId={data.religionId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, religionId: id }))}
          placeholder="Search or select religion/spirituality…"
        />

        {/* Multi-select taxonomy */}
        <MultiSelect
          label="Philosophical stance"
          options={toOptions(philosophy)}
          valueIds={data.philosophyIds ?? []}
          onChangeIds={(ids) => setData((p: any) => ({ ...p, philosophyIds: ids }))}
          placeholder="Select tags…"
        />
      </section>
    </div>
  );
}
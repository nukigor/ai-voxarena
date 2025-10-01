"use client";

import * as React from "react";
import { SliderField } from "@/components/ui/forms/SliderField";
import { MultiSelect, type Option } from "@/components/ui/forms/MultiSelect";
import { SingleSelect } from "@/components/ui/forms/SingleSelect";
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
  const [arch, setArch] = React.useState<Taxo[]>([]);
  const [philosophy, setPhilosophy] = React.useState<Taxo[]>([]);
  const [cultures, setCultures] = React.useState<Taxo[]>([]); // Culture multi

  React.useEffect(() => {
    (async () => {
      const [a, ph, cu] = await Promise.all([
        fetchTaxonomy("archetype"),
        fetchTaxonomy("philosophy"),
        fetchTaxonomy("culture"),
      ]);
      setArch(a || []);
      setPhilosophy(ph || []);
      setCultures(cu || []);
    })();
  }, []);

  const confidence = typeof data.confidence === "number" ? data.confidence : 5;

  // persist default confidence=5 so it saves consistently
  React.useEffect(() => {
    setData((p: any) => (typeof p.confidence === "number" ? p : { ...p, confidence: 5 }));
  }, [setData]);

  // Required: archetypes>=1, temperament, confidence 0..10, Region (in cultureId), communityTypeId
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
          valueIds={Array.isArray(data.archetypeIds) ? data.archetypeIds : []}
          onChangeIds={(ids) => setData((p: any) => ({ ...p, archetypeIds: ids }))}
          placeholder="Select one or more archetypes…"
          error={
            showErrors && (!Array.isArray(data.archetypeIds) || data.archetypeIds.length === 0)
              ? "Select at least one archetype."
              : undefined
          }
        />

        <SingleSelect
          label="Temperament"
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

        {/* Region (single select, taxonomy=region) */}
        <TaxonomySelect
          category="region"
          label="Region"
          valueId={data.cultureId ?? null}  // keep storage key name for backward compatibility
          onChangeId={(id) => setData((p: any) => ({ ...p, cultureId: id }))}
          required
          placeholder="Search or select a region…"
          error={showErrors && !data.cultureId ? "Region is required." : undefined}
        />

        {/* Culture (multi-select, optional, taxonomy=culture) */}
        <MultiSelect
          label="Culture (optional)"
          options={toOptions(cultures)}
          valueIds={Array.isArray(data.cultureIds) ? data.cultureIds : []}
          onChangeIds={(ids) => setData((p: any) => ({ ...p, cultureIds: ids }))}
          placeholder="Select cultural affiliations…"
        />

        {/* Community type */}
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

        <TaxonomySelect
          category="political"
          label="Political orientation"
          valueId={data.politicalId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, politicalId: id }))}
          placeholder="Search or select political orientation…"
        />

        <TaxonomySelect
          category="religion"
          label="Religion / Spirituality"
          valueId={data.religionId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, religionId: id }))}
          placeholder="Search or select religion/spirituality…"
        />

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
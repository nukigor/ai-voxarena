"use client";

import * as React from "react";
import { MultiSelect } from "@/components/ui/forms/MultiSelect";
import { SingleSelect } from "@/components/ui/forms/SingleSelect";
import { SliderField } from "@/components/ui/forms/SliderField";
import { TaxonomySelect } from "@/components/ui/forms/TaxonomySelect";
import { TextField } from "@/components/ui/forms/TextField";
import {
  APPROACH_OPTIONS,
  CONFLICT_STYLE_OPTIONS,
  VOCABULARY_OPTIONS,
  TONE_OPTIONS,
} from "@/lib/personaOptions";

type Option = { value: string; label: string };

export default function DebateCommunicationStep({
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
  // Default value for verbosity slider if not set
  const verbosity = typeof data.verbosity === "number" ? data.verbosity : 5;

  // Required: at least one approach, plus conflictStyle, vocabulary, verbosity, tone
  const valid =
    Array.isArray(data.debateApproach) &&
    data.debateApproach.length > 0 &&
    !!data.conflictStyle &&
    typeof verbosity === "number" &&
    !!data.vocabularyStyle &&
    !!data.tone;

  React.useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  // Optional: persist default 5 into state so it’s saved
  React.useEffect(() => {
    setData((p: any) =>
      typeof p.verbosity === "number" ? p : { ...p, verbosity: 5 }
    );
  }, [setData]);

  return (
    <div className="space-y-8">
      {/* Debate Style */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Debate Style
        </h3>

        {/* Approach (multi-select, required) */}
        <MultiSelect
          label={
            <>
              Approach <span className="text-red-600">*</span>
            </>
          }
          options={(APPROACH_OPTIONS as Option[]).map((o) => ({
            id: o.value,
            label: o.label,
          }))}
          valueIds={(data.debateApproach as string[]) ?? []}
          onChangeIds={(ids) => setData((p) => ({ ...p, debateApproach: ids }))}
          placeholder="Select one or more…"
          error={
            showErrors &&
            (!Array.isArray(data.debateApproach) ||
              data.debateApproach.length === 0)
              ? "Select at least one approach."
              : undefined
          }
        />

        {/* Conflict style (single, required) */}
        <SingleSelect
          label={
            <>
              Conflict style <span className="text-red-600">*</span>
            </>
          }
          placeholder="Select…"
          value={data.conflictStyle ?? null}
          onChange={(v) => setData((p) => ({ ...p, conflictStyle: v }))}
          options={CONFLICT_STYLE_OPTIONS}
          error={
            showErrors && !data.conflictStyle
              ? "Conflict style is required."
              : undefined
          }
        />
      </section>

      {/* Communication Style */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Communication Style
        </h3>

        {/* Vocabulary (single, required) */}
        <SingleSelect
          label={
            <>
              Vocabulary <span className="text-red-600">*</span>
            </>
          }
          placeholder="Select…"
          value={data.vocabularyStyle ?? null}
          onChange={(v) => setData((p) => ({ ...p, vocabularyStyle: v }))}
          options={VOCABULARY_OPTIONS}
          error={
            showErrors && !data.vocabularyStyle
              ? "Vocabulary is required."
              : undefined
          }
        />

        {/* Verbosity (slider 1–10, default 5, required) */}
        <SliderField
          label="Verbosity"
          labels={["Short", "Medium", "Long"]}
          value={verbosity}
          onChange={(v) => setData((p) => ({ ...p, verbosity: v }))}
          min={1}
          max={10}
          required
        />
        {showErrors &&
          !(typeof verbosity === "number" && verbosity >= 1 && verbosity <= 10) && (
            <p className="text-sm text-red-600 dark:text-red-400">
              Verbosity is required.
            </p>
          )}

        {/* Tone (single, required) */}
        <SingleSelect
          label={
            <>
              Tone <span className="text-red-600">*</span>
            </>
          }
          placeholder="Select…"
          value={data.tone ?? null}
          onChange={(v) => setData((p) => ({ ...p, tone: v }))}
          options={TONE_OPTIONS}
          error={
            showErrors && !data.tone ? "Tone is required." : undefined
          }
        />

        {/* Accent / Dialect (taxonomy single-select) */}
        <TaxonomySelect
          category="accent"
          label="Accent / Dialect"
          placeholder="Search or select an accent…"
          valueId={null}
          valueTerm={data.accentNote ?? ""}
          onChangeId={() => {}}
          onChangeTaxo={(item) =>
            setData((p) => ({ ...p, accentNote: item?.term ?? "" }))
          }
        />
      </section>
    </div>
  );
}
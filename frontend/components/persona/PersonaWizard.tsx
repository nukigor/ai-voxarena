// components/persona/PersonaWizard.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type WizardProps = {
  mode?: "create" | "edit";
  personaId?: string;             // required for edit
  initialData?: Record<string, any>;
};

export default function PersonaWizard({ mode = "create", personaId, initialData }: WizardProps) {
  const router = useRouter();

  // ---- wizard state (simplified; keep your existing step state management)
  const [data, setData] = useState<Record<string, any>>({});

  // Prefill on mount for edit
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setData((d) => ({ ...d, ...initialData }));
    }
  }, [mode, initialData]);

  // Utility: build payload as in your create flow
  function buildPayload(raw: Record<string, any>) {
    return {
      ...raw,
      confidence: typeof raw.confidence === "number" ? raw.confidence : 5,
      verbosity: typeof raw.verbosity === "number" ? raw.verbosity : 5,

      archetypeIds: Array.isArray(raw.archetypeIds) ? raw.archetypeIds : [],
      philosophyIds: Array.isArray(raw.philosophyIds) ? raw.philosophyIds : [],
      fillerPhraseIds: Array.isArray(raw.fillerPhraseIds) ? raw.fillerPhraseIds : [],
      metaphorIds: Array.isArray(raw.metaphorIds) ? raw.metaphorIds : [],
      debateHabitIds: Array.isArray(raw.debateHabitIds) ? raw.debateHabitIds : [],
      debateApproach: Array.isArray(raw.debateApproach) ? raw.debateApproach : [],

      cultureId: raw.cultureId ?? null,
      communityTypeId: raw.communityTypeId ?? null,
      politicalId: raw.politicalId ?? null,
      religionId: raw.religionId ?? null,
      universityId: raw.universityId ?? null,
      organizationId: raw.organizationId ?? null,
      accentId: raw.accentId ?? null,
      accentNote: typeof raw.accentNote === "string" ? raw.accentNote : "",

      quirksText: typeof raw.quirksText === "string" ? raw.quirksText : "",
      ageGroup: raw.ageGroup ?? null,
      genderIdentity: raw.genderIdentity ?? null,
      pronouns: typeof raw.pronouns === "string" ? raw.pronouns : "",
      temperament: raw.temperament ?? null,
      vocabularyStyle: raw.vocabularyStyle ?? null,
      conflictStyle: raw.conflictStyle ?? null,
      tone: raw.tone ?? null,
    };
  }

  async function handleSubmit() {
    const payload = buildPayload(data);

    const url =
      mode === "edit" && personaId
        ? `/api/personas/${personaId}`
        : `/api/personas`;

    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      console.error("Save failed:", e);
      alert(`Save failed: ${e?.error ?? res.statusText}`);
      return;
    }

    // Go back to list
    router.push("/personas");
    router.refresh();
  }

  // Render your existing multi-step form; hook step controls to setData
  return (
    <div className="space-y-4">
      {/* ... your existing steps here ... */}
      {/* make sure all inputs read/write to `data` via setData */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          className="px-4 py-2 rounded bg-gray-200"
          onClick={() => router.push("/personas")}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded bg-black text-white"
          onClick={handleSubmit}
        >
          {mode === "edit" ? "Save changes" : "Create persona"}
        </button>
      </div>
    </div>
  );
}
"use client";

import * as React from "react";
import { TextAreaField } from "@/components/ui/forms/TextAreaField";
import { TaxonomySelect } from "@/components/ui/forms/TaxonomySelect";

export default function EducationOrgStep({
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
  // No required fields in this step
  const valid = true;

  React.useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Education and Employment
        </h3>

        <TaxonomySelect
          label="University"
          category="university"
          valueId={data.universityId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, universityId: id }))}
          placeholder="Search or select a university…"
        />

        <TaxonomySelect
          label="Organization / Employer"
          category="organization"
          valueId={data.organizationId ?? null}
          onChangeId={(id) => setData((p: any) => ({ ...p, organizationId: id }))}
          placeholder="Search or select an organization…"
        />

        {/* Profession / Role (textarea) */}
        <TextAreaField
          id="profession"
          label="Profession / Role"
          placeholder="e.g., Economist, Policy Lead"
          value={data.profession ?? ""}
          onChange={(v) => setData((p: any) => ({ ...p, profession: v }))}
          rows={3}
        />
      </section>
    </div>
  );
}
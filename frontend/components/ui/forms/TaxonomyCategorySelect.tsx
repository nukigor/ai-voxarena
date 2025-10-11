"use client";

import * as React from "react";
import SingleSelect from "@/components/ui/forms/SingleSelect";

type Props = {
  /** Selected category (fullName) */
  value: string | null;
  /** Called with the selected fullName (or null when cleared if allowUnselect) */
  onChange: (value: string | null) => void;
  /** Optional label above the control (defaults to "Category") */
  label?: string;
  /** Placeholder text when nothing selected */
  placeholder?: string;
  /** Whether the field is required (prevents unselect) */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Optional className for the wrapper */
  className?: string;
};

type CategoryOption = { value: string; label: string };

export default function TaxonomyCategorySelect({
  value,
  onChange,
  label = "Category",
  placeholder = "Select a category",
  required = false,
  disabled = false,
  className = "",
}: Props) {
  const [options, setOptions] = React.useState<CategoryOption[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load all categories (we request a large page size to avoid pagination here)
        const params = new URLSearchParams({ page: "1", pageSize: "1000" });
        const res = await fetch(`/api/taxonomycategories?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        const items: any[] = Array.isArray(data?.items) ? data.items : [];
        const opts = items
          .map((x) => x?.fullName)
          .filter(Boolean)
          .map((fullName: string) => ({ value: fullName, label: fullName }));
        if (!cancelled) setOptions(opts);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load categories");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Match visual style of TaxonomySelect by delegating to the same SingleSelect control.
  // SingleSelect props in this repo: { label, options, value, onChange, placeholder, allowUnselect }
  // - We pass `allowUnselect={!required}` so users can clear the value when not required.
  // - We surface loading/error via placeholder to avoid visual jumps.
  const effectivePlaceholder =
    loading ? "Loading…" : error ? "Failed to load categories" : placeholder;

  return (
    <div className={className}>
      <SingleSelect
        label={label}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={effectivePlaceholder}
        allowUnselect={!required}
        disabled={disabled || loading || !!error}
      />
    </div>
  );
}
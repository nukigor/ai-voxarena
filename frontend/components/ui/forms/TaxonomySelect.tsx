"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon, XMarkIcon } from "@heroicons/react/20/solid";

type Taxo = { id: string; term: string; category: string };

async function fetchTaxonomy(category: string): Promise<Taxo[]> {
  const res = await fetch(`/api/taxonomy?category=${encodeURIComponent(category)}`, { cache: "no-store" });
  if (!res.ok) return [];
  return await res.json();
}

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Props = {
  label: string;
  category: string;             // e.g. "university" | "organization" | "accent"
  valueId: string | null;       // selected taxonomy id (if you store ids)
  onChangeId: (id: string | null) => void;
  // NEW: allow binding by term when your schema stores the label (e.g. accentNote)
  valueTerm?: string | null;
  onChangeTaxo?: (item: Taxo | null) => void;

  placeholder?: string;
  required?: boolean;
  error?: string;
};

export function TaxonomySelect({
  label,
  category,
  valueId,
  onChangeId,
  valueTerm,
  onChangeTaxo,
  placeholder = "Search or select…",
  required,
  error,
}: Props) {
  const [options, setOptions] = React.useState<Taxo[]>([]);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    (async () => {
      const xs = await fetchTaxonomy(category);
      setOptions(xs || []);
    })();
  }, [category]);

  // Prefer id; fall back to term (for label-bound fields)
  const selected = React.useMemo(() => {
    const byId = options.find((t) => t.id === valueId) ?? null;
    if (byId) return byId;
    if (valueTerm && valueTerm.trim() !== "") {
      return options.find((t) => t.term === valueTerm) ?? null;
    }
    return null;
  }, [options, valueId, valueTerm]);

  const filtered =
    query.trim() === ""
      ? options
      : options.filter((t) => t.term.toLowerCase().includes(query.toLowerCase()));

  const hasError = Boolean(error);
  const inputId = React.useId();
  const errId = `${inputId}-err`;

  function handleChange(val: Taxo | null) {
    onChangeId(val?.id ?? null);
    onChangeTaxo?.(val ?? null);
  }

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-900 dark:text-white">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>

      <div className="relative mt-2">
        <Combobox value={selected} onChange={handleChange} nullable>
          <div className="relative">
            <ComboboxInput
              id={inputId}
              aria-describedby={hasError ? errId : undefined}
              aria-invalid={hasError || undefined}
              displayValue={(item: Taxo | null) => item?.term ?? ""}
              onChange={(e) => setQuery(e.target.value)}
              className={cx(
                "grid w-full cursor-text grid-cols-1 rounded-md bg-white py-1.5 pr-9 pl-3",
                "text-left text-gray-900 outline-1 -outline-offset-1 sm:text-sm/6",
                hasError
                  ? "outline-red-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 dark:text-red-400 dark:outline-red-500/50 dark:focus:outline-red-400"
                  : "outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 dark:text-white dark:outline-white/10 dark:focus-visible:outline-indigo-500"
              )}
              placeholder={placeholder}
            />

            {/* Right-side icons (clear + chevron) */}
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center gap-1">
              {selected && (
                <button
                  type="button"
                  onClick={() => handleChange(null)}
                  className="pointer-events-auto rounded p-1 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={`Clear ${label.toLowerCase()}`}
                >
                  <XMarkIcon className="size-4" />
                </button>
              )}
              <ComboboxButton className="pointer-events-auto">
                <ChevronUpDownIcon aria-hidden="true" className="size-5 text-gray-500 dark:text-gray-400" />
              </ComboboxButton>
            </div>

            <ComboboxOptions
              transition
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5
                         data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in data-[closed]:data-[leave]:opacity-0
                         sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
            >
              {filtered.map((opt) => (
                <ComboboxOption
                  key={opt.id}
                  value={opt}
                  className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-[focus]:bg-indigo-600 data-[focus]:text-white data-[focus]:outline-hidden dark:text-white dark:data-[focus]:bg-indigo-500"
                >
                  {/* Selected = bold, not highlighted (highlight only on hover/focus) */}
                  <span className="block truncate font-normal group-data-[selected]:font-semibold">
                    {opt.term}
                  </span>

                  {/* Checkmark visible when selected; invert color on hover/focus */}
                  <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white dark:text-indigo-400">
                    <CheckIcon aria-hidden="true" className="size-5" />
                  </span>
                </ComboboxOption>
              ))}
              {filtered.length === 0 && (
                <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">No matches</div>
              )}
            </ComboboxOptions>
          </div>
        </Combobox>
      </div>

      {hasError && (
        <p id={errId} className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
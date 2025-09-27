// frontend/components/ui/forms/MultiSelect.tsx
"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";

export type Option = { id: string; label: string };

type Props = {
  label: string;
  options: Option[];
  valueIds: string[];
  onChangeIds: (ids: string[]) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function MultiSelect({
  label,
  options,
  valueIds,
  onChangeIds,
  placeholder = "Select…",
  error,
  required,
}: Props) {
  const [query, setQuery] = React.useState("");

  const selectedOptions = React.useMemo(
    () => valueIds.map((id) => options.find((o) => o.id === id)).filter(Boolean) as Option[],
    [valueIds, options]
  );

  const filtered =
    query.trim() === ""
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  const removeId = (id: string) => onChangeIds(valueIds.filter((x) => x !== id));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>

      <Combobox
        multiple
        value={selectedOptions}
        onChange={(vals: Option[]) => onChangeIds(vals.map((v) => v.id))}
        as="div"
      >
        <div className="relative">
          <ComboboxInput
            displayValue={() => ""}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={cx(
              "grid w-full cursor-text grid-cols-1 rounded-md bg-white py-1.5 pr-9 pl-3",
              "text-left text-gray-900 outline-1 -outline-offset-1",
              error
                ? "outline-red-300 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 dark:text-red-400 dark:outline-red-500/50 dark:focus:outline-red-400"
                : "outline-gray-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 dark:text-white dark:outline-white/10 dark:focus-visible:outline-indigo-500",
              "sm:text-sm/6"
            )}
          />
          <ComboboxButton className="absolute inset-y-0 right-2 inline-flex items-center">
            <ChevronUpDownIcon aria-hidden="true" className="size-5 text-gray-500 dark:text-gray-400" />
          </ComboboxButton>

          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
            {filtered.length === 0 ? (
              <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">No matches</div>
            ) : (
              filtered.map((opt) => (
                <ComboboxOption
                  key={opt.id}
                  value={opt}
                  className={cx(
                    "group relative cursor-default py-2 pr-9 pl-3 select-none",
                    "text-gray-900 dark:text-white",
                    // highlight on hover/focus
                    "data-[focus]:bg-indigo-600 data-[focus]:text-white"
                  )}
                >
                  <span
                    className={cx(
                      "block truncate",
                      valueIds.includes(opt.id) ? "font-semibold" : "font-normal"
                    )}
                  >
                    {opt.label}
                  </span>

                  {/* checkmark for selected */}
                  {valueIds.includes(opt.id) && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-600 dark:text-indigo-400 group-data-[focus]:text-white">
                      <CheckIcon aria-hidden="true" className="size-5" />
                    </span>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>

      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-x-0.5 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 inset-ring inset-ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:inset-ring-indigo-400/30"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => removeId(opt.id)}
                className="group relative -mr-1 size-3.5 rounded-xs hover:bg-indigo-600/20 dark:hover:bg-indigo-500/30"
                aria-label={`Remove ${opt.label}`}
              >
                <svg
                  viewBox="0 0 14 14"
                  className="size-3.5 stroke-indigo-600/50 group-hover:stroke-indigo-600/75 dark:stroke-indigo-400 dark:group-hover:stroke-indigo-300"
                >
                  <path d="M4 4l6 6m0-6l-6 6" />
                </svg>
                <span className="absolute -inset-1" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <ExclamationCircleIcon className="size-4" />
          {error}
        </p>
      )}
    </div>
  );
}
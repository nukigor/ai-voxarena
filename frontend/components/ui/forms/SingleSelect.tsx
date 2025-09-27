"use client";

import * as React from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { CheckIcon } from "@heroicons/react/20/solid";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";

type Option = { value: string; label: string };

type Props = {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options?: Option[];             // ← optional; guarded below
  placeholder?: string;
  error?: string;
  required?: boolean;
  id?: string;
};

export function SingleSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  required,
  id,
}: Props) {
  // Guard options to an empty array to prevent `.find` on undefined
  const opts = React.useMemo<Option[]>(() => (Array.isArray(options) ? options : []), [options]);

  const selected = React.useMemo<Option | null>(
    () => (value ? opts.find((o) => o.value === value) ?? null : null),
    [opts, value]
  );

  const hasError = Boolean(error);
  const inputId = id ?? React.useId();
  const errId = `${inputId}-error`;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-900 dark:text-white">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>

      <Listbox value={selected} onChange={(opt: Option | null) => onChange(opt?.value ?? null)}>
        <div className="relative mt-1">
          <ListboxButton
            id={inputId}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errId : undefined}
            className={[
              "grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-8 pl-3 text-left",
              "text-sm text-gray-900 outline-1 -outline-offset-1 focus-visible:outline-2 focus-visible:-outline-offset-2",
              hasError
                ? "outline-red-300 focus-visible:outline-red-600 dark:text-red-400 dark:outline-red-500/50 dark:focus-visible:outline-red-400"
                : "outline-gray-300 focus-visible:outline-indigo-600 dark:text-white dark:outline-white/10 dark:focus-visible:outline-indigo-500",
            ].join(" ")}
          >
            <span className={`col-start-1 row-start-1 truncate pr-6 ${selected ? "" : "text-gray-500 dark:text-gray-400"}`}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronUpDownIcon
              aria-hidden="true"
              className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
            />
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline-1 outline-black/5 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in data-[closed]:data-[leave]:opacity-0 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
          >
            {opts.length === 0 ? (
              <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">No options</div>
            ) : (
              opts.map((opt) => (
                <ListboxOption
                  key={opt.value}
                  value={opt}
                  className="group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none data-[focus]:bg-indigo-600 data-[focus]:text-white data-[focus]:outline-hidden dark:text-white dark:data-[focus]:bg-indigo-500"
                >
                  <span className="block truncate font-normal group-data-[selected]:font-semibold">
                    {opt.label}
                  </span>
                  <span className="absolute inset-y-0 right-0 hidden items-center pr-3 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white dark:text-indigo-400">
                    <CheckIcon aria-hidden="true" className="size-5" />
                  </span>
                </ListboxOption>
              ))
            )}
          </ListboxOptions>
        </div>
      </Listbox>

      {hasError && (
        <p id={errId} className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <ExclamationCircleIcon className="size-4" />
          {error}
        </p>
      )}
    </div>
  );
}

export default SingleSelect;
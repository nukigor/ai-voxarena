"use client";

import * as React from "react";
import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { CheckIcon } from "@heroicons/react/20/solid";

type Option = { value: string; label: string };
type Props = {
  label: string;
  value: string | null;
  onChange: (val: string | null) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  required?: boolean;
};

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
  required,
}: Props) {
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <Label className="block text-sm font-medium text-gray-900 dark:text-white">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </Label>

      <div className="relative mt-1">
        <Listbox value={value ?? ""} onChange={(v: string) => onChange(v || null)}>
          <ListboxButton
            className={[
              "grid w-full cursor-default grid-cols-1 rounded-md border bg-white py-1.5 pr-2 pl-3 text-left text-gray-900",
              "border-gray-300 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm",
              "dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500",
              hasError && "border-red-300 focus:border-red-600 focus:ring-red-600",
            ].join(" ")}
          >
            <span className="col-start-1 row-start-1 truncate pr-6">
              {value || placeholder}
            </span>
            <ChevronUpDownIcon
              aria-hidden="true"
              className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400"
            />
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in data-[closed]:data-[leave]:opacity-0 sm:text-sm dark:bg-gray-800 dark:shadow-none dark:ring-white/10"
          >
            {/* Placeholder */}
            <ListboxOption
              key="_blank"
              value=""
              className={({ active }) =>
                [
                  "relative cursor-default select-none py-2 pl-3 pr-9",
                  active
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "text-gray-900 dark:text-white",
                ].join(" ")
              }
            >
              {({ selected }) => (
                <>
                  <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                    {placeholder}
                  </span>
                  {selected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 dark:text-indigo-400">
                      <CheckIcon aria-hidden="true" className="size-5" />
                    </span>
                  )}
                </>
              )}
            </ListboxOption>

            {options.map((opt) => (
              <ListboxOption
                key={opt.value}
                value={opt.value}
                className={({ active }) =>
                  [
                    "relative cursor-default select-none py-2 pl-3 pr-9",
                    active
                      ? "bg-indigo-600 text-white dark:bg-indigo-500"
                      : "text-gray-900 dark:text-white",
                  ].join(" ")
                }
              >
                {({ selected, active }) => (
                  <>
                    <span className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                      {opt.label}
                    </span>
                    {selected && (
                      <span
                        className={[
                          "absolute inset-y-0 right-0 flex items-center pr-4",
                          active ? "text-white" : "text-indigo-600 dark:text-indigo-400",
                        ].join(" ")}
                      >
                        <CheckIcon aria-hidden="true" className="size-5" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      </div>

      {hasError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
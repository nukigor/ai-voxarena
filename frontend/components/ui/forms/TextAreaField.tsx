"use client";

import * as React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: string;
  helpText?: string;
  required?: boolean;
};

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  helpText,
  required,
}: Props) {
  const inputId = id ?? React.useId();
  const errId = `${inputId}-error`;
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-900 dark:text-white"
      >
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <div className="mt-2">
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errId : undefined}
          className={[
            "block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900",
            "outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400",
            "focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6",
            "dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500",
            hasError &&
              "text-red-900 placeholder:text-red-300 outline-red-300 focus:outline-red-600 dark:text-red-400 dark:outline-red-500/50 dark:focus:outline-red-400",
          ].join(" ")}
        />
        {hasError && (
          <ExclamationCircleIcon
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-3 size-5 text-red-500 sm:size-4 dark:text-red-400"
          />
        )}
      </div>
      {hasError ? (
        <p id={errId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helpText ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      ) : null}
    </div>
  );
}
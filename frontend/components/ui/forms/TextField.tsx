"use client";

import * as React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/16/solid";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  error?: string;
  helpText?: string;
  required?: boolean;
  autoComplete?: string;
};

export function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  helpText,
  required,
  autoComplete,
}: Props) {
  const inputId = id ?? React.useId();
  const errId = `${inputId}-error`;
  const hasError = Boolean(error);

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-900 dark:text-white">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <div className="mt-1 grid grid-cols-1">
        <input
          id={inputId}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errId : undefined}
          autoComplete={autoComplete}
          className={[
            "col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-10 pl-3",
            "text-sm text-gray-900 placeholder:text-gray-400",
            "border border-gray-300 focus:border-indigo-600 focus:outline-none focus:ring-indigo-600",
            "dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-500",
            hasError &&
              "text-red-900 placeholder:text-red-300 border-red-300 focus:border-red-600 dark:text-red-400 dark:border-red-500/50",
          ].join(" ")}
        />
        {hasError && (
          <ExclamationCircleIcon
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-3 size-5 self-center justify-self-end text-red-500 sm:size-4 dark:text-red-400"
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
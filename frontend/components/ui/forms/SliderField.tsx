"use client";

import * as React from "react";

type Props = {
  id?: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
  required?: boolean;
  /** Left, middle, right labels */
  labels?: [string, string, string];
};

export function SliderField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  helpText,
  required,
  labels,
}: Props) {
  const inputId = id ?? React.useId();

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-900 dark:text-white"
      >
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>

      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-600 dark:accent-indigo-500"
      />

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{(labels ?? ["Low", "Medium", "High"])[0]}</span>
        <span>{(labels ?? ["Low", "Medium", "High"])[1]}</span>
        <span>{(labels ?? ["Low", "Medium", "High"])[2]}</span>
      </div>
    </div>
  );
}
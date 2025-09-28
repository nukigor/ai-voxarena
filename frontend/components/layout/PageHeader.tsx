// frontend/components/layout/PageHeader.tsx
import * as React from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode; // optional actions (e.g., Delete button)
};

export default function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}
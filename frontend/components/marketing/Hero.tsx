// frontend/components/marketing/Hero.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Props = {
  title?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
};

export default function Hero({
  title = "Debate with AI Personas.",
  subtitle = "Host structured debates, live captions, and instant summaries. Built for teams, classrooms, and curious minds.",
  primaryCtaText = "Start a debate",
  primaryCtaHref = "/debates",
  secondaryCtaText = "See pricing",
  secondaryCtaHref = "/pricing",
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-b from-white to-zinc-50 p-8 md:p-12">
      {/* subtle backdrop shape */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-20%] h-80 w-[60%] rounded-full bg-[radial-gradient(60%_60%_at_50%_50%,rgba(14,165,233,0.15),transparent_60%)]"
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-zinc-600">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
          VoxArena · AI debates platform
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-600 md:text-lg">
          {subtitle}
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={primaryCtaHref}>
            <Button size="lg">{primaryCtaText}</Button>
          </Link>
          <Link href={secondaryCtaHref} className="inline-flex">
            <Button size="lg" variant="secondary">
              {secondaryCtaText}
            </Button>
          </Link>
        </div>

        {/* small meta row */}
        <div className="mt-4 text-xs text-zinc-500">
          No credit card required · Accessible components · Built with Tailwind
        </div>
      </div>
    </section>
  );
}
// frontend/components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/", label: "Home" },
  { href: "/personas", label: "Personas" },
  { href: "/debates", label: "Debates" },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition
        ${active ? "bg-black text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
    >
      {label}
    </Link>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-bold text-lg">VoxArena</Link>

        {/* Desktop nav */}
        <nav className="hidden gap-1 md:flex">
          {nav.map((n) => <NavLink key={n.href} {...n} />)}
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center rounded-md p-2 md:hidden hover:bg-zinc-100"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="border-t md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 p-2">
            {nav.map((n) => (
              <NavLink key={n.href} {...n} />
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
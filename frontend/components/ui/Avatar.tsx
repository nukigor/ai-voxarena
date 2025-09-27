import * as React from "react";

const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 } as const;
type SizeToken = keyof typeof SIZE_MAP;

/** Stable HSL background from a string */
function hashToHsl(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return `hsl(${Math.abs(h) % 360} 70% 40%)`;
}

type AvatarProps = {
  /** Persona’s display name (used for initials + alt text) */
  name: string;
  /** Image URL if available; initials used when not provided or image fails */
  src?: string | null;
  /** Size in pixels or token ("xs" | "sm" | "md" | "lg" | "xl") */
  size?: number | SizeToken;
  /** Optional rounded variant: "full" | "lg" (default: full) */
  radius?: "full" | "lg";
  /** Extra classes for layout tweaks */
  className?: string;
  /** Optional presence/status dot color (e.g., "bg-emerald-500") */
  statusClassName?: string;
};

export function Avatar({
  name,
  src,
  size = 40,
  radius = "full",
  className = "",
  statusClassName,
}: AvatarProps) {
  const [broken, setBroken] = React.useState(false);
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

  const px = typeof size === "number" ? size : SIZE_MAP[size] ?? SIZE_MAP.md;
  const rounded = radius === "full" ? "rounded-full" : "rounded-lg";
  const baseStyle = { width: px, height: px };

  // If we have a src and it hasn’t failed, render the image
  if (src && !broken) {
    return (
      <div className={`relative inline-flex ${className}`} style={baseStyle}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={name}
          src={src}
          width={px}
          height={px}
          className={`${rounded} object-cover w-full h-full`}
          onError={() => setBroken(true)}
          loading="lazy"
        />
        {statusClassName && (
          <span
            aria-hidden
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 ${statusClassName} ${
              rounded === "rounded-full" ? "rounded-full" : "rounded"
            } ring-2 ring-white`}
          />
        )}
      </div>
    );
  }

  // Fallback: colored circle with initials
  const bg = hashToHsl(name || "?");
  return (
    <div
      className={`relative inline-flex items-center justify-center text-white font-semibold ${rounded} ${className}`}
      style={{ ...baseStyle, background: bg }}
      aria-label={name}
      role="img"
    >
      <span style={{ fontSize: Math.max(12, Math.floor(px * 0.4)) }}>{initials || "?"}</span>
      {statusClassName && (
        <span
          aria-hidden
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 ${statusClassName} ${
            rounded === "rounded-full" ? "rounded-full" : "rounded"
          } ring-2 ring-white`}
        />
      )}
    </div>
  );
}
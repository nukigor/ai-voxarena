// frontend/lib/debateOptions.ts

export const debateConfigDefaults = {
  structured: {
    openingsSec: 60,
    rebuttalsSec: 60,
    closingsSec: 45,
    crossfirePrompts: 1,
    orderPolicy: "randomized",
  },
  podcast: {
    responsesSec: 45,
    quickfire: true,
    depth: "normal",
  },
} as const;

export type DebateFormat = keyof typeof debateConfigDefaults; // "structured" | "podcast"

export const debateFormats: { value: DebateFormat; label: string }[] = [
  { value: "structured", label: "Structured debate" },
  { value: "podcast", label: "Podcast conversation" },
];

export function isDebateFormat(x: string): x is DebateFormat {
  return x === "structured" || x === "podcast";
}
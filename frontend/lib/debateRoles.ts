// frontend/lib/debateRoles.ts
export type DebateRole = "MODERATOR" | "DEBATER" | "HOST" | "GUEST";

export function roleOptionsForFormat(format?: string) {
  const f = (format || "").toLowerCase();
  if (f === "podcast") {
    return [
      { value: "HOST" as DebateRole, label: "Host" },
      { value: "GUEST" as DebateRole, label: "Guest" },
    ];
  }
  // structured (default)
  return [
    { value: "MODERATOR" as DebateRole, label: "Moderator" },
    { value: "DEBATER" as DebateRole, label: "Debater" },
  ];
}
// Works without the "openai" package. Uses fetch.
// If OPENAI_API_KEY is missing or the API fails, returns a deterministic fallback.

export type PersonaForAI = {
  id: string;
  name: string;
  nickname?: string | null;
  bio?: string | null;
  culturalBackground?: string | null;
  profession?: string | null;
  education?: string | null;
  worldview?: string | null;
  temperament?: string | null;
  conflictStyle?: string | null;
  vocabularyStyle?: string | null;
  debateApproach?: string[] | null;
  quirks?: string[] | null;
  expertise?: string[] | null;
};

const SYSTEM = `You write concise, vivid persona descriptions (140–220 words).
Audience: general readers on a profile page.
Tone: evocative but grounded; avoid clichés and overstatement.
Perspective: third-person.
Avoid lists; write a single flowing paragraph.`;

function buildPrompt(p: PersonaForAI) {
  const lines: string[] = [];
  lines.push(`Name: ${p.name}${p.nickname ? ` (“${p.nickname}”)` : ""}`);
  if (p.bio) lines.push(`Bio: ${p.bio}`);
  if (p.culturalBackground) lines.push(`Cultural background: ${p.culturalBackground}`);
  if (p.profession) lines.push(`Profession: ${p.profession}`);
  if (p.education) lines.push(`Education: ${p.education}`);
  if (p.worldview) lines.push(`Worldview: ${p.worldview}`);
  if (p.temperament) lines.push(`Temperament: ${p.temperament}`);
  if (p.conflictStyle) lines.push(`Conflict style: ${p.conflictStyle}`);
  if (p.vocabularyStyle) lines.push(`Vocabulary style: ${p.vocabularyStyle}`);
  if (p.debateApproach?.length) lines.push(`Debate approach: ${p.debateApproach.join("; ")}`);
  if (p.quirks?.length) lines.push(`Quirks: ${p.quirks.join("; ")}`);
  if (p.expertise?.length) lines.push(`Expertise: ${p.expertise.join("; ")}`);

  return [
    `Write a 140–220 word profile description for an AI debate persona using the details below.`,
    `Do NOT use bullet points or headings. One paragraph only.`,
    `Avoid repeating the name more than twice.`,
    ``,
    lines.join("\n"),
  ].join("\n");
}

function fallbackText(p: PersonaForAI): string {
  const bits = [
    p.profession && `a ${p.profession}`,
    p.culturalBackground && `rooted in ${p.culturalBackground}`,
    p.education && `educated in ${p.education}`,
    p.worldview && `guided by a ${p.worldview} worldview`,
  ].filter(Boolean);
  const s1 = `${p.name}${p.nickname ? ` (“${p.nickname}”)` : ""} is ${bits.join(", ")}.`;
  const s2 = p.debateApproach?.length
    ? `In debates, they tend to ${p.debateApproach.join(", ")}.`
    : `In debates, they balance clarity with curiosity.`;
  const s3 = [
    p.temperament && `Temperament: ${p.temperament}`,
    p.conflictStyle && `Conflict style: ${p.conflictStyle}`,
    p.vocabularyStyle && `Vocabulary: ${p.vocabularyStyle}`,
  ].filter(Boolean).join(" · ");
  const s4 = [
    p.quirks?.length ? `Quirks: ${p.quirks.join(", ")}.` : "",
    p.expertise?.length ? `Areas of focus: ${p.expertise.join(", ")}.` : "",
  ].filter(Boolean).join(" ");
  return [s1, s2, s3 && `${s3}.`, s4].filter(Boolean).join(" ");
}

export async function generatePersonaDescription(p: PersonaForAI): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackText(p);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt(p) },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("OpenAI error:", res.status, errText);
      return fallbackText(p);
    }

    const json: any = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : fallbackText(p);
  } catch (e) {
    console.error("OpenAI request failed:", e);
    return fallbackText(p);
  }
}
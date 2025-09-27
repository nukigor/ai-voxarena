// frontend/lib/personaOptions.ts

export type Option = { id: string; label: string; value: string };

// Identity – Age (single)
export const AGE_OPTIONS: Option[] = [
  { id: "teen",         label: "Teen",          value: "Teen" },
  { id: "adult",        label: "Adult",         value: "Adult" },
  { id: "middle-aged",  label: "Middle-aged",   value: "Middle-aged" },
  { id: "senior",       label: "Senior",        value: "Senior" },
];

// Identity - gender (single)
export const GENDER_OPTIONS: Option[] = [
  { id: "male",        label: "Male",        value: "Male" },
  { id: "female",      label: "Female",      value: "Female" },
  { id: "non-binary",  label: "Non-binary",  value: "Non-binary" },
  { id: "other",       label: "Other",       value: "Other" },
];

// Personality – Temperament (single)
export const TEMPERAMENT_OPTIONS: Option[] = [
  { id: "calm",      label: "Calm",      value: "Calm" },
  { id: "fiery",     label: "Fiery",     value: "Fiery" },
  { id: "humorous",  label: "Humorous",  value: "Humorous" },
  { id: "assertive", label: "Assertive", value: "Assertive" },
];

// Debate Style – Approach (multi)
export const APPROACH_OPTIONS: Option[] = [
  { id: "confrontational", label: "Confrontational", value: "Confrontational" },
  { id: "collaborative",   label: "Collaborative",   value: "Collaborative" },
  { id: "logical",         label: "Logical",         value: "Logical" },
  { id: "emotional",       label: "Emotional",       value: "Emotional" },
  { id: "philosophical",   label: "Philosophical",   value: "Philosophical" },
  { id: "humorous",        label: "Humorous",        value: "Humorous" },
];

// Debate Style – Conflict Style (single)
export const CONFLICT_STYLE_OPTIONS: Option[] = [
  { id: "confrontational", label: "Confrontational", value: "Confrontational" },
  { id: "diplomatic",      label: "Diplomatic",      value: "Diplomatic" },
  { id: "passive",         label: "Passive",         value: "Passive" },
];

// Communication Style – Vocabulary (single)
export const VOCABULARY_OPTIONS: Option[] = [
  { id: "academic",     label: "Academic",     value: "Academic" },
  { id: "street-slang", label: "Street slang", value: "Street slang" },
  { id: "poetic",       label: "Poetic",       value: "Poetic" },
  { id: "bureaucratic", label: "Bureaucratic", value: "Bureaucratic" },
  { id: "direct",       label: "Direct",       value: "Direct" },
];

// Communication Style – Tone (single)
export const TONE_OPTIONS: Option[] = [
  { id: "warm",     label: "Warm",     value: "Warm" },
  { id: "neutral",  label: "Neutral",  value: "Neutral" },
  { id: "assertive",label: "Assertive",value: "Assertive" },
  { id: "ironic",   label: "Ironic",   value: "Ironic" },
];
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import IdentityStep from "./steps/IdentityStep";
import EducationOrgStep from "./steps/EducationOrgStep";
import PersonaCultureBeliefsStep from "./steps/PersonaCultureBeliefsStep";
import DebateCommunicationStep from "./steps/DebateCommunicationStep";
import QuirksHabitsStep from "./steps/QuirksHabitsStep";
import { CheckIcon } from "@heroicons/react/24/solid";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";

type WizardData = Record<string, any>;

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Normalize the payload before sending to API
function buildPayload(raw: Record<string, any>) {
  return {
    ...raw,

    // sliders default to 5
    confidence: typeof raw.confidence === "number" ? raw.confidence : 5,
    verbosity: typeof raw.verbosity === "number" ? raw.verbosity : 5,

    // multi-selects as arrays
    archetypeIds: Array.isArray(raw.archetypeIds) ? raw.archetypeIds : [],
    philosophyIds: Array.isArray(raw.philosophyIds) ? raw.philosophyIds : [],
    fillerPhraseIds: Array.isArray(raw.fillerPhraseIds) ? raw.fillerPhraseIds : [],
    metaphorIds: Array.isArray(raw.metaphorIds) ? raw.metaphorIds : [],
    debateHabitIds: Array.isArray(raw.debateHabitIds) ? raw.debateHabitIds : [],

    // single-selects (nullable)
    cultureId: raw.cultureId ?? null,
    communityTypeId: raw.communityTypeId ?? null,
    politicalId: raw.politicalId ?? null,
    religionId: raw.religionId ?? null,

    // taxonomy bound by term
    accentNote: typeof raw.accentNote === "string" ? raw.accentNote : "",

    // free text
    quirksText: typeof raw.quirksText === "string" ? raw.quirksText : "",
  };
}

const STEP_DEFS = [
  { id: "01", name: "Identity", description: "" },
  { id: "02", name: "Education & Work", description: "" },
  {
    id: "03",
    name: "Personality",
    description: "",
  },
  {
    id: "04",
    name: "Debate & Comms",
    description: "",
  },
  {
    id: "05",
    name: "Quirks & Habits",
    description: "",
  },
];

export default function PersonaWizard({
  initialData,
  onSaved,
}: {
  initialData?: WizardData;
  onSaved?: (created: any) => void;
}) {
  const router = useRouter();

  const [data, setData] = React.useState<WizardData>(initialData ?? { name: "" });
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  // validation state for current step
  const [isStepValid, setIsStepValid] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);

  // dialog state
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const steps = STEP_DEFS.map((s, idx) => ({
    ...s,
    status: idx < step ? "complete" : idx === step ? "current" : "upcoming",
  }));

  async function doSave() {
    try {
      setSaving(true);
      setSaveError(null);

      const payload = buildPayload(data);
      const isUpdate = Boolean(payload.id);
      const url = isUpdate ? `/api/personas/${encodeURIComponent(payload.id)}` : "/api/personas";
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to save persona");

      onSaved?.(json);
      router.push("/personas");
    } catch (e: any) {
      setSaveError(e?.message || "Failed to save persona");
      alert(e?.message || "Failed to save persona");
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Progress bar */}
      <div className="lg:border-t lg:border-b lg:border-gray-200 dark:lg:border-white/15">
        <nav aria-label="Progress" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ol
            role="list"
            className="overflow-hidden rounded-md lg:flex lg:rounded-none lg:border-r lg:border-l lg:border-gray-200 dark:lg:border-white/15"
          >
            {steps.map((s, stepIdx) => (
              <li key={s.id} className="relative overflow-hidden lg:flex-1">
                <div
                  className={classNames(
                    stepIdx === 0 ? "rounded-t-md border-b-0" : "",
                    stepIdx === steps.length - 1 ? "rounded-b-md border-t-0" : "",
                    "overflow-hidden border border-gray-200 lg:border-0 dark:border-white/15"
                  )}
                >
                  {s.status === "complete" ? (
                    <button type="button" onClick={() => setStep(stepIdx)} className="group w-full text-left">
                      <span
                        aria-hidden="true"
                        className="absolute top-0 left-0 h-full w-1 bg-transparent group-hover:bg-gray-200 lg:top-auto lg:bottom-0 lg:h-1 lg:w-full dark:group-hover:bg-white/20"
                      />
                      <span
                        className={classNames(
                          stepIdx !== 0 ? "lg:pl-9" : "",
                          "flex items-start px-6 py-5 text-sm font-medium"
                        )}
                      >
                        <span className="shrink-0">
                          <span className="flex size-10 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500">
                            <CheckIcon aria-hidden="true" className="size-6 text-white" />
                          </span>
                        </span>
                        <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.description}</span>
                        </span>
                      </span>
                    </button>
                  ) : s.status === "current" ? (
                    <div aria-current="step">
                      <span
                        aria-hidden="true"
                        className="absolute top-0 left-0 h-full w-1 bg-indigo-600 lg:top-auto lg:bottom-0 lg:h-1 lg:w-full dark:bg-indigo-500"
                      />
                      <span
                        className={classNames(
                          stepIdx !== 0 ? "lg:pl-9" : "",
                          "flex items-start px-6 py-5 text-sm font-medium"
                        )}
                      >
                        <span className="shrink-0">
                          <span className="flex size-10 items-center justify-center rounded-full border-2 border-indigo-600 dark:border-indigo-500">
                            <span className="text-indigo-600 dark:text-indigo-400">{s.id}</span>
                          </span>
                        </span>
                        <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{s.name}</span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.description}</span>
                        </span>
                      </span>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setStep(stepIdx)} className="group w-full text-left">
                      <span
                        aria-hidden="true"
                        className="absolute top-0 left-0 h-full w-1 bg-transparent group-hover:bg-gray-200 lg:top-auto lg:bottom-0 lg:h-1 lg:w-full dark:group-hover:bg-white/20"
                      />
                      <span
                        className={classNames(
                          stepIdx !== 0 ? "lg:pl-9" : "",
                          "flex items-start px-6 py-5 text-sm font-medium"
                        )}
                      >
                        <span className="shrink-0">
                          <span className="flex size-10 items-center justify-center rounded-full border-2 border-gray-300 dark:border-white/15">
                            <span className="text-gray-500 dark:text-gray-400">{s.id}</span>
                          </span>
                        </span>
                        <span className="mt-0.5 ml-4 flex min-w-0 flex-col">
                          <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
                            {s.name}
                          </span>
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.description}</span>
                        </span>
                      </span>
                    </button>
                  )}

                  {stepIdx !== 0 && (
                    <div aria-hidden="true" className="absolute inset-0 top-0 left-0 hidden w-3 lg:block">
                      <svg
                        fill="none"
                        viewBox="0 0 12 82"
                        preserveAspectRatio="none"
                        className="size-full text-gray-300 dark:text-white/15"
                      >
                        <path d="M0.5 0V31L10.5 41L0.5 51V82" stroke="currentcolor" vectorEffect="non-scaling-stroke" />
                      </svg>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-gray-900">
        {step === 0 && (
          <IdentityStep
            data={data ?? {}}
            setData={(updater) => setData((prev) => (typeof updater === "function" ? updater(prev ?? {}) : updater))}
            onValidityChange={setIsStepValid}
            showErrors={showErrors}
          />
        )}

        {step === 1 && (
          <EducationOrgStep
            data={data ?? {}}
            setData={(updater) => setData((prev) => (typeof updater === "function" ? updater(prev ?? {}) : updater))}
            onValidityChange={setIsStepValid}
            showErrors={showErrors}
          />
        )}

        {step === 2 && (
          <PersonaCultureBeliefsStep
            data={data ?? {}}
            setData={(updater) => setData((prev) => (typeof updater === "function" ? updater(prev ?? {}) : updater))}
            onValidityChange={setIsStepValid}
            showErrors={showErrors}
          />
        )}

        {step === 3 && (
          <DebateCommunicationStep
            data={data ?? {}}
            setData={(updater) => setData((prev) => (typeof updater === "function" ? updater(prev ?? {}) : updater))}
            onValidityChange={setIsStepValid}
            showErrors={showErrors}
          />
        )}

        {/* NEW STEP */}
        {step === 4 && (
          <QuirksHabitsStep
            data={data ?? {}}
            setData={(updater) => setData((prev) => (typeof updater === "function" ? updater(prev ?? {}) : updater))}
            onValidityChange={setIsStepValid}
            showErrors={showErrors}
          />
        )}
      </div>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setShowErrors(false);
            setStep((s) => Math.max(0, s - 1));
          }}
          disabled={step === 0}
          className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 inset-ring inset-ring-gray-300 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-white/5 dark:inset-ring-white/10"
        >
          Back
        </button>

        {step < STEP_DEFS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (isStepValid) {
                setShowErrors(false);
                setStep((s) => Math.min(STEP_DEFS.length - 1, s + 1));
              } else {
                setShowErrors(true);
              }
            }}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={saving || !data?.name}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {saving ? "Saving…" : "Save persona"}
          </button>
        )}
      </div>

      {/* Save confirmation dialog */}
      <Dialog open={confirmOpen} onClose={setConfirmOpen} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/50"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10"
            >
              <div>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
                  <CheckIcon aria-hidden="true" className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                    Save persona?
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This will save the current persona to your database. You can edit it later.
                    </p>
                    {saveError ? (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{saveError}</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={doSave}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => setConfirmOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
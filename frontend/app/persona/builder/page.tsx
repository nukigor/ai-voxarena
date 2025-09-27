// Server component is fine; it just renders the client wizard.
import PersonaWizard from "@/components/persona/PersonaWizard";

export default function PersonaBuilderPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
        Persona Builder
      </h1>
      <PersonaWizard />
    </div>
  );
}
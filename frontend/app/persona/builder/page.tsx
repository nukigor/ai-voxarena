import PageHeader from "@/components/layout/PageHeader";
import PersonaWizard from "@/components/persona/PersonaWizard";

export default function CreatePersonaPage() {
  return (
    <>
      <PageHeader title="Create Persona" />
      <PersonaWizard />
    </>
  );
}
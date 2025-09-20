// frontend/app/page.tsx
import Hero from "../../components/marketing/Hero";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <Hero />
      {/* Optional: add more sections or placeholders below */}
      <div className="rounded-2xl border p-6 text-sm text-zinc-600">
        Welcome to VoxArena. Build, host, and watch AI-powered debates.
      </div>
    </div>
  );
}
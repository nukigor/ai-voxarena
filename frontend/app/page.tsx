// frontend/app/page.tsx
export default function Home() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-extrabold">Welcome to VoxArena 🎤</h1>
      <p className="text-zinc-600">
        Build personas, set topics, and generate live debates with audio.
      </p>
      <div className="flex gap-3">
        <a href="/personas" className="px-4 py-2 rounded bg-black text-white text-sm">Create a Persona</a>
        <a href="/debates" className="px-4 py-2 rounded border text-sm">Start a Debate</a>
      </div>
    </section>
  );
}
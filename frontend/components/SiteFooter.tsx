// frontend/components/SiteFooter.tsx
export default function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-500 flex items-center justify-between">
        <p>© {new Date().getFullYear()} VoxArena</p>
        <p>
          <a href="https://github.com/nukigor/voxarena" className="hover:underline">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
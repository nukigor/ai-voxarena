import "./globals.css";
import SiteNavbar from "@/components/layout/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "VoxArena",
  description: "AI Persona Debate Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <SiteNavbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
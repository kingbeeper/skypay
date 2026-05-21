import Link from "next/link";
import { requireGuest } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireGuest();

  return (
    <div className="relative flex flex-col flex-1">
      <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-semibold uppercase tracking-[0.2em]">
            <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-indigo-500" />
            SKYPAY
          </Link>
        </div>
      </header>
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}

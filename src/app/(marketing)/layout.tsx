import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  return (
    <div className="relative flex flex-col flex-1">
      <div
        className="fixed inset-0 grid-bg pointer-events-none -z-10"
        aria-hidden
      />
      <header className="sticky top-0 z-30 backdrop-blur-md bg-[color:var(--background)]/85 border-b border-white/[0.08]">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono font-semibold uppercase tracking-[0.2em]"
          >
            <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-indigo-500" />
            SKYPAY
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="hidden sm:inline text-zinc-400 hover:text-white transition-colors"
            >
              Precios
            </Link>
            <Link
              href="/faq"
              className="hidden sm:inline text-zinc-400 hover:text-white transition-colors"
            >
              FAQ
            </Link>
            <Link
              href="/status"
              className="hidden sm:inline text-zinc-400 hover:text-white transition-colors"
            >
              Status
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center rounded-full bg-white text-black px-4 font-medium hover:bg-zinc-200 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-full bg-white text-black px-4 font-medium hover:bg-zinc-200 transition-colors"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="relative z-10 flex-1 mx-auto max-w-5xl w-full px-6 py-12 sm:py-20">
        {children}
      </main>
      <footer className="relative z-10 border-t border-white/[0.06] mt-20">
        <div className="mx-auto max-w-5xl px-6 py-10 grid sm:grid-cols-3 gap-6 text-xs font-mono text-zinc-500">
          <div>
            <div className="font-semibold uppercase tracking-[0.2em] text-zinc-300 mb-2">
              SKYPAY
            </div>
            <div className="text-zinc-600">© 2026 · Demo privada</div>
          </div>
          <div>
            <div className="text-zinc-400 mb-2">Producto</div>
            <div className="space-y-1">
              <FooterLink href="/explore">Explorar</FooterLink>
              <FooterLink href="/pricing">Precios</FooterLink>
              <FooterLink href="/faq">FAQ</FooterLink>
              <FooterLink href="/status">Status</FooterLink>
            </div>
          </div>
          <div>
            <div className="text-zinc-400 mb-2">Legal</div>
            <div className="space-y-1">
              <FooterLink href="/privacy">Privacidad</FooterLink>
              <FooterLink href="/terms">Términos</FooterLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div>
      <Link href={href} className="hover:text-zinc-200 transition-colors">
        {children}
      </Link>
    </div>
  );
}

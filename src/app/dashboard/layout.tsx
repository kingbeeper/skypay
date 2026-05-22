import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { MobileNav, type NavItem } from "./MobileNav";
import { BackButton } from "./BackButton";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { OnboardingTour } from "./OnboardingTour";
import { CommandPalette } from "./CommandPalette";
import { getTheme } from "@/lib/theme";

const baseNavItems: NavItem[] = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/markets", label: "Mercados" },
  { href: "/dashboard/swap", label: "Swap" },
  { href: "/dashboard/send", label: "Enviar" },
  { href: "/dashboard/send-user", label: "P2P" },
  { href: "/dashboard/receive", label: "Recibir" },
  { href: "/dashboard/card", label: "Tarjeta" },
  { href: "/dashboard/raffle", label: "Rifa", highlight: true },
  { href: "/dashboard/history", label: "Historial" },
  { href: "/dashboard/settings", label: "Ajustes" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const theme = await getTheme();
  const navItems: NavItem[] = user.isAdmin
    ? [
        ...baseNavItems,
        { href: "/dashboard/admin", label: "Admin", admin: true },
      ]
    : baseNavItems;

  return (
    <div className="relative flex flex-col flex-1">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] backdrop-blur-md bg-[color:var(--background)]/85">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-8 min-w-0">
            <MobileNav
              items={navItems}
              userEmail={user.email}
              isDemo={user.isDemo}
              isAdmin={user.isAdmin}
            />
            <BackButton />
            <Link
              href="/"
              className="flex items-center gap-2 font-mono font-semibold uppercase tracking-[0.2em] text-sm sm:text-base"
            >
              <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-indigo-500" />
              SKYPAY
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.soon ? "#" : item.href}
                  className={`px-3 py-1.5 rounded-full transition-colors ${
                    item.soon
                      ? "text-zinc-600 cursor-not-allowed"
                      : item.admin
                        ? "text-rose-300 hover:text-rose-200 hover:bg-rose-400/[0.06]"
                        : item.highlight
                          ? "text-amber-300 hover:text-amber-200 hover:bg-amber-400/[0.06]"
                          : "text-zinc-300 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                  {item.soon && (
                    <span className="ml-1.5 text-[10px] font-mono text-zinc-600">
                      soon
                    </span>
                  )}
                  {item.highlight && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
                  )}
                  {item.admin && (
                    <span className="ml-1.5 text-[10px] font-mono uppercase tracking-wider text-rose-400/70">
                      ★
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {user.isDemo && (
              <span className="hidden sm:inline-flex h-7 items-center rounded-full border border-cyan-400/30 bg-cyan-400/[0.08] px-3 text-xs font-mono text-cyan-100">
                modo demo
              </span>
            )}
            <span className="hidden lg:inline text-sm text-zinc-400 font-mono truncate max-w-[220px]">
              {user.email}
            </span>
            <NotificationBell />
            <ThemeToggle current={theme} />
            <form action={logoutAction}>
              <button
                type="submit"
                className="h-8 rounded-full border border-white/10 px-3 text-xs text-zinc-300 hover:bg-white/[0.04] transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-10">
        {children}
      </main>
      <OnboardingTour />
      <CommandPalette />
    </div>
  );
}

import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      <div
        className="absolute inset-0 grid-bg pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 40% at 50% 30%, rgba(34, 211, 238, 0.10), transparent 70%), radial-gradient(ellipse 50% 35% at 50% 80%, rgba(129, 140, 248, 0.10), transparent 70%)",
        }}
      />

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          {/* Brand */}
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-2xl shadow-cyan-500/20" />
            <div className="font-mono font-semibold uppercase tracking-[0.3em] text-2xl">
              SKYPAY
            </div>
            <p className="text-sm text-zinc-400 max-w-xs">
              Cripto y tarjeta. Una sola app para gastar tu dinero como tú
              quieras.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-12 w-full space-y-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full h-12 inline-flex items-center justify-center rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
                >
                  Ir al dashboard
                </Link>
                <div className="text-xs font-mono text-zinc-500 pt-2">
                  Sesión iniciada como{" "}
                  <span className="text-zinc-300">{user.email}</span>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full h-12 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 text-black font-semibold hover:opacity-90 transition-opacity"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/login"
                  className="w-full h-12 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.02] font-medium text-zinc-100 hover:bg-white/[0.06] transition-colors"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>

          {/* Explore link */}
          <div className="mt-10">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Explorar Skypay
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-16 flex items-center gap-2 text-[10px] font-mono text-zinc-600">
            <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
            Demo privada · acceso por invitación
          </div>
        </div>
      </main>
    </div>
  );
}

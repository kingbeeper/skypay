import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateCurrentRound } from "@/lib/raffle";
import { Countdown } from "@/app/dashboard/raffle/Countdown";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  const raffle = await getOrCreateCurrentRound();

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden />

      <header className="relative z-10 sticky top-0 backdrop-blur-md bg-[color:var(--background)]/70 border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-semibold uppercase tracking-[0.2em]">
            <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 to-indigo-500" />
            SKYPAY
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-9 items-center rounded-full bg-white text-black px-4 font-medium hover:bg-zinc-200 transition-colors"
              >
                Ir al dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-zinc-300 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-9 items-center rounded-full bg-white text-black px-4 font-medium hover:bg-zinc-200 transition-colors"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 mx-auto max-w-5xl px-6 pt-24 pb-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-300 font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Demo privada · acceso por invitación
        </div>

        <h1 className="mt-8 mx-auto max-w-4xl text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
          Tu cripto.{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-cyan-100 to-indigo-300 bg-clip-text text-transparent">
            Gastable en cualquier comercio.
          </span>
        </h1>

        <p className="mt-8 mx-auto max-w-2xl text-lg text-zinc-400 leading-relaxed">
          Una sola app para comprar, intercambiar y guardar cripto — más una
          tarjeta virtual o física que convierte al instante al pagar.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="inline-flex h-12 items-center justify-center rounded-full bg-white text-black px-6 font-medium hover:bg-zinc-200 transition-colors"
          >
            {user ? "Abrir dashboard" : "Crear cuenta"}
          </Link>
          {!user && (
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-6 font-medium hover:bg-white/[0.04] transition-colors"
            >
              Probar demo
            </Link>
          )}
        </div>

        <div className="mt-20 relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.1] via-orange-500/[0.05] to-transparent p-6 sm:p-8 text-left">
          <div
            aria-hidden
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl"
          />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/[0.08] px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-200">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Sorteo mensual abierto
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">
                Gana{" "}
                <span className="text-amber-300 font-mono">
                  {raffle.prizeBtc} BTC
                </span>{" "}
                en la rifa de Skypay.
              </h2>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Tickets desde ${raffle.ticketPriceUsd}. Cuantos más compres,
                mayor tu probabilidad. El ganador cobra al instante en su
                wallet — sin formularios, sin esperas.
              </p>
              <Link
                href={user ? "/dashboard/raffle" : "/signup"}
                className="mt-5 inline-flex h-11 items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black px-5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {user ? "Comprar tickets" : "Crear cuenta y participar"}
              </Link>
            </div>
            <div className="shrink-0 md:text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                Próximo sorteo
              </div>
              <Countdown target={raffle.drawsAt.toISOString()} />
            </div>
          </div>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06] text-left">
          {[
            {
              title: "Intercambia",
              body: "Conversiones entre BTC, ETH, USDC, SOL y USD al precio del mercado.",
            },
            {
              title: "Guarda",
              body: "Custodia segura con segregación de fondos y proof-of-reserves mensual.",
            },
            {
              title: "Gasta",
              body: "Tarjeta Visa virtual o física que cobra al saldo cripto que tú elijas.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-[color:var(--background)] p-6">
              <div className="text-sm font-mono text-cyan-400 mb-2">/ {f.title.toLowerCase()}</div>
              <div className="font-semibold mb-2">{f.title}</div>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

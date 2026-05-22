import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "/ mes",
    description: "Empieza sin coste. Ideal para usar la tarjeta a diario.",
    features: [
      "Tarjeta virtual gratis",
      "Swaps ilimitados a precio de mercado",
      "Depósitos por SEPA gratis",
      "1 rifa mensual incluida",
      "Soporte por chat",
    ],
    cta: "Crear cuenta",
    href: "/signup",
    accent: false,
  },
  {
    name: "Pro",
    price: "$8",
    period: "/ mes",
    description: "Tarjeta física + cashback en cripto + analytics avanzados.",
    features: [
      "Todo lo de Free",
      "Tarjeta física Visa",
      "1% cashback en cripto",
      "Sin spread en swaps",
      "Reportes fiscales automáticos",
      "Soporte prioritario",
    ],
    cta: "Probar 30 días gratis",
    href: "/signup",
    accent: true,
  },
  {
    name: "Business",
    price: "Personalizado",
    period: "",
    description: "Para empresas con cuentas múltiples y operaciones recurrentes.",
    features: [
      "Tarjetas para equipo",
      "API completa + webhooks",
      "SSO con Google/Microsoft",
      "Auditoría avanzada",
      "Manager dedicado",
      "SLA 99.99%",
    ],
    cta: "Hablar con ventas",
    href: "/faq",
    accent: false,
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <p className="text-sm font-mono text-cyan-400 mb-2">/ precios</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Planes simples y sin sorpresas
        </h1>
        <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
          Sin comisiones ocultas. Sin spread inflado. Cancela cuando quieras.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-3xl border p-6 sm:p-8 flex flex-col ${
              tier.accent
                ? "border-cyan-400/40 bg-gradient-to-br from-cyan-400/[0.06] to-indigo-500/[0.04]"
                : "border-white/[0.08] bg-white/[0.02]"
            }`}
          >
            {tier.accent && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full border border-cyan-400/40 bg-[color:var(--background)] px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                Más elegido
              </span>
            )}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                {tier.name}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm text-zinc-500 font-mono">
                    {tier.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-400">{tier.description}</p>
            </div>
            <ul className="mt-6 space-y-2 flex-1">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span className="text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={tier.href}
              className={`mt-6 h-11 inline-flex items-center justify-center rounded-full font-medium text-sm transition-colors ${
                tier.accent
                  ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-black hover:opacity-90"
                  : "border border-white/15 text-zinc-100 hover:bg-white/[0.04]"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="text-center text-xs font-mono text-zinc-600">
        Todos los planes incluyen acceso a la rifa mensual. Los precios son
        ilustrativos · demo no comercial.
      </div>
    </div>
  );
}

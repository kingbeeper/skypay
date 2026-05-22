import Link from "next/link";

type Props = {
  feature: string;
  description?: string;
};

/**
 * Renders a friendly blocked state for features that require KYC approval.
 * Server component — caller checks user.kycStatus and shows this instead of
 * the actual feature page when status !== "approved".
 */
export function KycRequired({ feature, description }: Props) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent p-7 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 rounded-full items-center justify-center bg-amber-500/[0.15] text-amber-300">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div className="flex-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300/80 mb-1">
              Verificación requerida
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Para {feature} primero verifica tu identidad
            </h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              {description ??
                "Por requerimientos regulatorios (KYC/AML) necesitamos verificar quién eres antes de habilitar movimientos de dinero. El proceso es rápido."}
            </p>
            <Link
              href="/dashboard/settings"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black px-5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Iniciar verificación →
            </Link>
            <p className="mt-3 text-[11px] font-mono text-zinc-500">
              Tarda ~2 minutos · DNI/Pasaporte + selfie + comprobante domicilio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

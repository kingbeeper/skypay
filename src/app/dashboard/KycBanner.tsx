import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function KycBanner() {
  const user = await getCurrentUser();
  if (!user || user.kycStatus === "approved") return null;

  return (
    <div className="sticky top-16 z-20 bg-amber-500/[0.12] border-b border-amber-500/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-10 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-amber-200 truncate">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="truncate">
            Verifica tu identidad para desbloquear todos los límites
          </span>
        </div>
        <Link
          href="/dashboard/settings"
          className="h-7 px-3 inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-100 text-[11px] font-mono hover:bg-amber-500/30 transition-colors shrink-0"
        >
          Iniciar KYC →
        </Link>
      </div>
    </div>
  );
}

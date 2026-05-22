import { getSession } from "@/lib/session";
import { stopImpersonatingAction } from "@/app/actions";

export async function ImpersonationBanner() {
  const session = await getSession();
  if (!session.impersonatedBy) return null;

  return (
    <div className="sticky top-16 z-20 bg-amber-500/[0.12] border-b border-amber-500/30 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-10 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-amber-200 truncate">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="truncate">
            Modo impersonate · viendo como{" "}
            <span className="text-amber-100">{session.email}</span>
          </span>
        </div>
        <form action={stopImpersonatingAction}>
          <button
            type="submit"
            className="h-7 px-3 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-100 text-[11px] font-mono hover:bg-amber-500/30 transition-colors shrink-0"
          >
            Volver a mi cuenta
          </button>
        </form>
      </div>
    </div>
  );
}

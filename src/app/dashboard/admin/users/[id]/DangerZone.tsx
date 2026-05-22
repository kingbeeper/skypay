"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  deleteUserAction,
  impersonateUserAction,
  type DeleteUserResult,
} from "@/app/actions";

type Props = {
  userId: string;
  userEmail: string;
  isSelf: boolean;
};

export function DangerZone({ userId, userEmail, isSelf }: Props) {
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [state, formAction, pending] = useActionState<
    DeleteUserResult,
    FormData
  >(deleteUserAction, undefined);

  useEffect(() => {
    if (state?.ok) {
      const t = setTimeout(() => router.push("/dashboard/admin"), 1200);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <section className="space-y-6">
      {!isSelf && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 rounded-full items-center justify-center font-mono text-sm bg-amber-400/[0.15] text-amber-300">
              👤
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">Login as this user</div>
              <div className="text-xs text-zinc-500 mt-0.5">
                Continúa la sesión como este usuario para debug. Queda
                registrado en el audit log. Podrás volver a tu cuenta cuando
                quieras.
              </div>
            </div>
            <form action={impersonateUserAction}>
              <input type="hidden" name="userId" value={userId} />
              <button
                type="submit"
                className="h-9 px-4 rounded-full border border-amber-500/40 bg-amber-500/[0.08] text-amber-200 text-sm font-medium hover:bg-amber-500/[0.16] transition-colors"
              >
                Login as user →
              </button>
            </form>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold tracking-tight mb-1 text-rose-300">
        Zona peligrosa
      </h2>
      <p className="text-sm text-zinc-500 mb-5">
        Acciones irreversibles. Cuidado.
      </p>

      <form
        action={formAction}
        className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-5 space-y-4"
      >
        <input type="hidden" name="userId" value={userId} />
        <div>
          <div className="font-medium">Eliminar usuario</div>
          <div className="text-xs text-zinc-500 mt-0.5">
            Borra el usuario y todos sus datos (balances, tarjetas,
            transacciones, entradas de rifa). Las rondas pasadas que ganó
            quedarán marcadas sin ganador. No se puede deshacer.
          </div>
        </div>

        {isSelf ? (
          <div className="text-xs font-mono text-zinc-500 px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.06]">
            No puedes eliminar tu propia cuenta desde aquí.
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                Escribe{" "}
                <span className="font-mono text-rose-300">{userEmail}</span>{" "}
                para confirmar
              </label>
              <input
                type="text"
                name="confirmEmail"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={userEmail}
                className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-rose-400/40 transition-colors"
              />
            </div>

            {state?.ok === false && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {state.error}
              </p>
            )}
            {state?.ok === true && (
              <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
                ✓ {state.email} eliminado. Redirigiendo…
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending || confirmEmail !== userEmail || state?.ok === true}
                className="h-10 px-5 rounded-full bg-rose-500 text-black font-semibold text-sm hover:bg-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? "Eliminando…" : "Eliminar definitivamente"}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}

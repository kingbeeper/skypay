"use client";

import { useActionState, useState } from "react";
import {
  deleteOwnAccountAction,
  type DeleteSelfResult,
} from "@/app/actions";

export function DeleteAccount({ email }: { email: string }) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [armed, setArmed] = useState(false);
  const [state, formAction, pending] = useActionState<
    DeleteSelfResult,
    FormData
  >(deleteOwnAccountAction, undefined);

  if (!armed) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-5">
        <div className="font-medium text-rose-200 mb-1">Eliminar mi cuenta</div>
        <p className="text-xs text-zinc-500 mb-4">
          Se borrarán balances, tarjetas, transacciones y participaciones en
          rifas. Esta acción no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setArmed(true)}
          className="h-9 px-4 rounded-full border border-rose-500/40 bg-rose-500/[0.08] text-rose-200 text-sm font-medium hover:bg-rose-500/[0.16] transition-colors"
        >
          Entendido, quiero continuar
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-5 space-y-3"
    >
      <div>
        <div className="font-medium text-rose-200 mb-1">
          Confirma escribiendo tu correo
        </div>
        <p className="text-xs text-zinc-500">
          Escribe{" "}
          <span className="font-mono text-rose-300 break-all">{email}</span>{" "}
          para confirmar.
        </p>
      </div>
      <input
        type="text"
        name="confirmEmail"
        value={confirmEmail}
        onChange={(e) => setConfirmEmail(e.target.value)}
        placeholder={email}
        autoComplete="off"
        spellCheck={false}
        className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-rose-400/40 transition-colors"
      />
      {state?.ok === false && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            setArmed(false);
            setConfirmEmail("");
          }}
          disabled={pending}
          className="h-9 px-4 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending || confirmEmail !== email}
          className="h-9 px-4 rounded-full bg-rose-500 text-black text-sm font-semibold hover:bg-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Eliminando…" : "Eliminar para siempre"}
        </button>
      </div>
    </form>
  );
}

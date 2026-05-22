"use client";

import { useActionState } from "react";
import {
  updateNameAction,
  type ProfileUpdateResult,
} from "@/app/actions";

export function NameForm({ currentName }: { currentName: string }) {
  const [state, formAction, pending] = useActionState<
    ProfileUpdateResult,
    FormData
  >(updateNameAction, undefined);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3"
    >
      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400">
        Nombre
      </label>
      <input
        type="text"
        name="name"
        defaultValue={currentName}
        maxLength={60}
        placeholder="Juan Pérez"
        className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm outline-none focus:border-cyan-400/40 transition-colors"
      />
      {state?.ok === false && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
          ✓ {state.message}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

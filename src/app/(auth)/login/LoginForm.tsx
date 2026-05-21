"use client";

import { useActionState, useTransition } from "react";
import { loginAction, demoLoginAction, type AuthResult } from "@/app/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    loginAction,
    undefined
  );
  const [demoPending, startDemo] = useTransition();

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <Field label="Correo" name="email" type="email" required autoFocus />
        <Field label="Contraseña" name="password" type="password" required />
        {state?.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-11 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[color:var(--background)] px-3 text-xs font-mono text-zinc-500">
            o
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={demoPending}
        onClick={() => startDemo(() => demoLoginAction())}
        className="w-full h-11 rounded-full border border-cyan-400/30 bg-cyan-400/[0.08] text-cyan-100 font-medium hover:bg-cyan-400/[0.15] transition-colors disabled:opacity-50"
      >
        {demoPending ? "Cargando demo…" : "Acceso demo (inversores)"}
      </button>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-xs text-zinc-400 mb-1.5 font-mono">{label}</span>
      <input
        {...props}
        className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-colors"
      />
    </label>
  );
}

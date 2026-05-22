"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  loginAction,
  demoLoginAction,
  type LoginActionResult,
} from "@/app/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<
    LoginActionResult,
    FormData
  >(loginAction, undefined);
  const [demoPending, startDemo] = useTransition();
  const [totpNeeded, setTotpNeeded] = useState(false);

  useEffect(() => {
    if (state && "totpRequired" in state && state.totpRequired) {
      setTotpNeeded(true);
    }
  }, [state]);

  const errorMessage = state && "error" in state ? state.error : undefined;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <Field
          label="Correo"
          name="email"
          type="email"
          required
          autoFocus
          disabled={totpNeeded}
        />
        <Field
          label="Contraseña"
          name="password"
          type="password"
          required
          disabled={totpNeeded}
        />
        {totpNeeded && (
          <div className="space-y-1.5">
            <span className="block text-xs text-zinc-400 mb-1.5 font-mono">
              Código 2FA
            </span>
            <input
              name="totpToken"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              placeholder="123456"
              className="w-full h-11 rounded-lg border border-cyan-400/40 bg-cyan-400/[0.05] px-3 text-base font-mono tracking-[0.3em] text-center text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400/60 transition-colors"
            />
            <p className="text-[11px] font-mono text-zinc-500 mt-1.5">
              Abre tu autenticador y pega el código de 6 dígitos.
            </p>
          </div>
        )}
        {errorMessage && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full h-11 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {pending ? "Entrando…" : totpNeeded ? "Verificar y entrar" : "Entrar"}
        </button>
        {totpNeeded && (
          <button
            type="button"
            onClick={() => setTotpNeeded(false)}
            className="w-full text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Cambiar de cuenta
          </button>
        )}
      </form>

      {!totpNeeded && (
        <>
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
        </>
      )}
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-xs text-zinc-400 mb-1.5 font-mono">
        {label}
      </span>
      <input
        {...props}
        className="w-full h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.05] transition-colors disabled:opacity-50"
      />
    </label>
  );
}

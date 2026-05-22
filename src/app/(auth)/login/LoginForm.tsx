"use client";

import { useActionState, useEffect, useState } from "react";
import {
  loginAction,
  type LoginActionResult,
} from "@/app/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<
    LoginActionResult,
    FormData
  >(loginAction, undefined);
  const [totpNeeded, setTotpNeeded] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);

  useEffect(() => {
    if (state && "totpRequired" in state && state.totpRequired) {
      setTotpNeeded(true);
    }
  }, [state]);

  const errorMessage = state && "error" in state ? state.error : undefined;
  const lockedUntil =
    state && "locked" in state && state.locked ? state.until : undefined;

  return (
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
      {totpNeeded && !useRecovery && (
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
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono text-zinc-500 mt-1.5">
              Código de 6 dígitos del autenticador.
            </p>
            <button
              type="button"
              onClick={() => setUseRecovery(true)}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Usar recovery code →
            </button>
          </div>
        </div>
      )}
      {totpNeeded && useRecovery && (
        <div className="space-y-1.5">
          <span className="block text-xs text-zinc-400 mb-1.5 font-mono">
            Recovery code
          </span>
          <input
            name="recoveryCode"
            type="text"
            autoComplete="off"
            required
            autoFocus
            placeholder="a1b2c3d4e5"
            className="w-full h-11 rounded-lg border border-amber-400/40 bg-amber-400/[0.05] px-3 text-base font-mono tracking-wider text-center text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400/60 transition-colors lowercase"
          />
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono text-zinc-500 mt-1.5">
              Uno de los 10 códigos que guardaste al activar 2FA.
            </p>
            <button
              type="button"
              onClick={() => setUseRecovery(false)}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Volver al código
            </button>
          </div>
        </div>
      )}
      {lockedUntil && (
        <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          🔒 Cuenta bloqueada hasta{" "}
          {new Date(lockedUntil).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          por demasiados intentos fallidos.
        </p>
      )}
      {errorMessage && !lockedUntil && (
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

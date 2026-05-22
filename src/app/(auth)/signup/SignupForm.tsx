"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signupAction, type AuthResult } from "@/app/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    signupAction,
    undefined
  );
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref")?.toUpperCase() ?? "";

  return (
    <form action={formAction} className="space-y-3">
      {ref && <input type="hidden" name="ref" value={ref} />}
      {ref && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.06] px-3 py-2 text-xs text-cyan-200">
          🎁 Te registras con código{" "}
          <span className="font-mono font-bold">{ref}</span> — recibirás $10
          de bienvenida.
        </div>
      )}
      <Field label="Nombre" name="name" type="text" autoFocus />
      <Field label="Correo" name="email" type="email" required />
      <Field
        label="Contraseña (mín. 8 caracteres)"
        name="password"
        type="password"
        required
        minLength={8}
      />
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
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
    </form>
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

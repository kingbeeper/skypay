"use client";

import { useActionState } from "react";
import {
  changePasswordAction,
  type ProfileUpdateResult,
} from "@/app/actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<
    ProfileUpdateResult,
    FormData
  >(changePasswordAction, undefined);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4"
    >
      <Field label="Contraseña actual" name="currentPassword" type="password" required />
      <Field
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        required
        minLength={8}
        hint="mínimo 8 caracteres"
      />
      <Field
        label="Confirmar nueva contraseña"
        name="confirmPassword"
        type="password"
        required
        minLength={8}
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
          {pending ? "Guardando…" : "Cambiar contraseña"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] font-mono text-zinc-600">{hint}</span>
        )}
      </div>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={
          type === "password"
            ? name.startsWith("new") || name === "confirmPassword"
              ? "new-password"
              : "current-password"
            : undefined
        }
        className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-cyan-400/40 transition-colors"
      />
    </div>
  );
}

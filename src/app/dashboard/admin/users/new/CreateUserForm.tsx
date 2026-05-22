"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createUserAction, type CreateUserResult } from "@/app/actions";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState<
    CreateUserResult,
    FormData
  >(createUserAction, undefined);

  const [showPassword, setShowPassword] = useState(false);

  if (state?.ok === true) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-6">
          <div className="text-emerald-300 text-2xl mb-2">✓</div>
          <div className="text-lg font-semibold">Usuario creado</div>
          <div className="mt-1 text-sm text-zinc-400">
            <span className="font-mono text-zinc-200">{state.email}</span>
          </div>

          {state.generatedPassword && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 mb-1">
                Contraseña generada · solo verás esto una vez
              </div>
              <div className="font-mono text-base text-amber-100 break-all select-all">
                {state.generatedPassword}
              </div>
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(state.generatedPassword!)
                }
                className="mt-3 inline-flex h-7 items-center gap-1.5 rounded-full border border-amber-400/30 px-3 text-[11px] font-mono text-amber-200 hover:bg-amber-400/[0.08] transition-colors"
              >
                Copiar al portapapeles
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/admin/users/${state.userId}`}
            className="flex-1 h-11 inline-flex items-center justify-center rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Ver perfil
          </Link>
          <Link
            href="/dashboard/admin"
            className="flex-1 h-11 inline-flex items-center justify-center rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Correo *">
        <input
          type="email"
          name="email"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="usuario@dominio.com"
          className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-cyan-400/40 transition-colors"
        />
      </Field>

      <Field label="Nombre" hint="opcional">
        <input
          type="text"
          name="name"
          autoComplete="off"
          placeholder="Juan Pérez"
          className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm outline-none focus:border-cyan-400/40 transition-colors"
        />
      </Field>

      <Field
        label="Contraseña"
        hint="opcional · si se deja en blanco se genera aleatoriamente"
      >
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            minLength={8}
            placeholder="al menos 8 caracteres"
            className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 pr-20 text-sm font-mono outline-none focus:border-cyan-400/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2.5 rounded-md text-[11px] font-mono text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-colors"
          >
            {showPassword ? "ocultar" : "ver"}
          </button>
        </div>
      </Field>

      <Field label="Balance inicial USD" hint="opcional">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-zinc-500">
            $
          </span>
          <input
            type="number"
            name="initialUsd"
            defaultValue="0"
            min="0"
            step="0.01"
            className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] pl-7 pr-3 text-sm font-mono outline-none focus:border-cyan-400/40 transition-colors"
          />
        </div>
      </Field>

      <div className="space-y-2">
        <label className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 cursor-pointer hover:bg-white/[0.04] transition-colors">
          <input
            type="checkbox"
            name="isDemo"
            className="mt-0.5 h-4 w-4 rounded accent-cyan-400 cursor-pointer"
          />
          <span className="text-sm">
            <span className="font-medium">Marcar como demo</span>
            <span className="block text-xs text-zinc-500 mt-0.5">
              Solo afecta al pill visible en la UI.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 cursor-pointer hover:bg-white/[0.04] transition-colors">
          <input
            type="checkbox"
            name="isAdmin"
            className="mt-0.5 h-4 w-4 rounded accent-rose-400 cursor-pointer"
          />
          <span className="text-sm">
            <span className="font-medium text-rose-300">Hacer admin</span>
            <span className="block text-xs text-zinc-500 mt-0.5">
              Da acceso al panel de administración.
            </span>
          </span>
        </label>
      </div>

      {state?.ok === false && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Link
          href="/dashboard/admin"
          className="flex-1 h-12 inline-flex items-center justify-center rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 h-12 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Creando…" : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
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
      {children}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import {
  createWebhookAction,
  type WebhookCreateResult,
} from "@/app/actions";

export function CreateWebhookForm() {
  const [state, formAction, pending] = useActionState<
    WebhookCreateResult,
    FormData
  >(createWebhookAction, undefined);

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3"
    >
      <Field label="Nombre">
        <input
          name="name"
          required
          maxLength={60}
          placeholder="Slack #alerts"
          className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm outline-none focus:border-cyan-400/40 transition-colors"
        />
      </Field>
      <Field label="URL">
        <input
          name="url"
          type="url"
          required
          placeholder="https://hooks.slack.com/services/…"
          className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-cyan-400/40 transition-colors"
        />
      </Field>
      <Field label="Secret" hint="opcional · se envía como header X-Skypay-Signature">
        <input
          name="secret"
          type="text"
          placeholder="whsec_…"
          className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-mono outline-none focus:border-cyan-400/40 transition-colors"
        />
      </Field>
      {state?.ok === false && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2">
          ✓ Webhook creado
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40"
        >
          {pending ? "Creando…" : "Crear webhook"}
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
        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
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

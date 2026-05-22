"use client";

import { useActionState } from "react";
import {
  fireTestWebhookAction,
  type FireWebhookResult,
} from "@/app/actions";

export function FireTestButton({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    FireWebhookResult,
    FormData
  >(fireTestWebhookAction, undefined);

  const lastStatus = state?.ok ? state.status : state?.ok === false ? state.error : null;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="eventType" value="test.ping" />
      <button
        type="submit"
        disabled={pending || disabled}
        title={disabled ? "Webhook pausado" : "Enviar evento de prueba"}
        className="h-8 px-3 rounded-full bg-cyan-400/[0.08] border border-cyan-400/30 text-xs font-mono text-cyan-200 hover:bg-cyan-400/[0.16] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "Enviando…" : "Probar"}
      </button>
      {lastStatus && (
        <span
          className={`text-[10px] font-mono ${
            state?.ok ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {lastStatus}
        </span>
      )}
    </form>
  );
}

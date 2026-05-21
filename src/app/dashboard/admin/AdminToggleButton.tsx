"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  setUserAdminAction,
  type AdminToggleResult,
} from "@/app/actions";

type Props = {
  userId: string;
  isAdmin: boolean;
  isSelf: boolean;
};

export function AdminToggleButton({ userId, isAdmin, isSelf }: Props) {
  const [state, formAction] = useActionState<AdminToggleResult, FormData>(
    setUserAdminAction,
    undefined
  );

  if (isSelf) {
    return (
      <span
        className="text-[10px] font-mono text-zinc-600"
        title="No puedes cambiar tu propio rol"
      >
        —
      </span>
    );
  }

  return (
    <form action={formAction} className="inline-flex flex-col items-end gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input
        type="hidden"
        name="makeAdmin"
        value={isAdmin ? "false" : "true"}
      />
      <SubmitBtn isAdmin={isAdmin} />
      {state?.ok === false && (
        <span className="text-[10px] font-mono text-red-400">
          {state.error}
        </span>
      )}
    </form>
  );
}

function SubmitBtn({ isAdmin }: { isAdmin: boolean }) {
  const { pending } = useFormStatus();
  const base =
    "inline-flex items-center h-7 rounded-full px-3 text-[11px] font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styled = isAdmin
    ? "border border-rose-500/30 bg-rose-500/[0.08] text-rose-300 hover:bg-rose-500/[0.16] hover:text-rose-200"
    : "border border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-rose-500/[0.08] hover:border-rose-500/30 hover:text-rose-200";
  return (
    <button type="submit" disabled={pending} className={`${base} ${styled}`}>
      {pending ? "…" : isAdmin ? "quitar admin" : "+ admin"}
    </button>
  );
}

"use client";

import { useActionState, useState, useTransition } from "react";
import {
  startTotpSetupAction,
  verifyTotpSetupAction,
  disableTotpAction,
  type TotpStartResult,
  type TotpVerifyResult,
  type TotpDisableResult,
} from "@/app/actions";

type Props = {
  enabled: boolean;
  qrDataUrlForExistingSecret?: string;
};

export function TwoFactor({ enabled }: Props) {
  if (enabled) return <DisableFlow />;
  return <EnableFlow />;
}

function EnableFlow() {
  const [setupStart, startTransition] = useTransition();
  const [setup, setSetup] = useState<{ secret: string; otpauth: string; qr: string } | null>(
    null
  );
  const [startError, setStartError] = useState<string | null>(null);
  const [verifyState, verifyAction, verifyPending] = useActionState<
    TotpVerifyResult,
    FormData
  >(verifyTotpSetupAction, undefined);

  const beginSetup = () => {
    setStartError(null);
    startTransition(async () => {
      const result: TotpStartResult = await startTotpSetupAction();
      if (!result.ok) {
        setStartError(result.error);
        return;
      }
      const qrRes = await fetch(
        `/api/totp-qr?data=${encodeURIComponent(result.otpauth)}`
      );
      const blob = await qrRes.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSetup({
          secret: result.secret,
          otpauth: result.otpauth,
          qr: reader.result as string,
        });
      };
      reader.readAsDataURL(blob);
    });
  };

  if (verifyState?.ok === true) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-5">
        <div className="text-emerald-300 text-xl mb-1">✓</div>
        <div className="font-medium">2FA activado</div>
        <div className="text-xs text-zinc-500 mt-1">
          La próxima vez que inicies sesión te pediremos el código de tu
          autenticador.
        </div>
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
        <div>
          <div className="font-medium">Autenticación en dos pasos (2FA)</div>
          <div className="text-xs text-zinc-500 mt-1">
            Añade una capa extra de seguridad con Google Authenticator, 1Password
            o Authy.
          </div>
        </div>
        {startError && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {startError}
          </p>
        )}
        <div>
          <button
            type="button"
            onClick={beginSetup}
            disabled={setupStart}
            className="h-9 px-4 rounded-full bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-40"
          >
            {setupStart ? "Generando…" : "Activar 2FA"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={verifyAction}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4"
    >
      <div>
        <div className="font-medium">Escanea el QR</div>
        <div className="text-xs text-zinc-500 mt-1">
          Abre tu app autenticadora y escanea este código. Si no puedes escanear,
          usa el secret manual debajo.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="rounded-xl bg-white p-3 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="QR para 2FA" width={180} height={180} />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
              Secret manual
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs break-all select-all">
              {setup.secret}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Código de verificación
            </label>
            <input
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              placeholder="123456"
              className="w-full h-11 rounded-xl border border-cyan-400/40 bg-cyan-400/[0.05] px-3 text-base font-mono tracking-[0.3em] text-center outline-none focus:border-cyan-400/60 transition-colors"
            />
          </div>
          {verifyState?.ok === false && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
              {verifyState.error}
            </p>
          )}
          <button
            type="submit"
            disabled={verifyPending}
            className="w-full h-10 rounded-full bg-cyan-400 text-black text-sm font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-40"
          >
            {verifyPending ? "Verificando…" : "Verificar y activar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function DisableFlow() {
  const [state, formAction, pending] = useActionState<
    TotpDisableResult,
    FormData
  >(disableTotpAction, undefined);
  const [armed, setArmed] = useState(false);

  if (state?.ok === true) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="font-medium">2FA desactivado</div>
        <div className="text-xs text-zinc-500 mt-1">
          Tu cuenta ya no requiere código al iniciar sesión.
        </div>
      </div>
    );
  }

  if (!armed) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
            activo
          </span>
          <span className="text-sm font-medium">2FA está activado</span>
        </div>
        <div className="text-xs text-zinc-500">
          Te pedimos un código al iniciar sesión. Para desactivarlo necesitas
          tu autenticador.
        </div>
        <div>
          <button
            type="button"
            onClick={() => setArmed(true)}
            className="h-9 px-4 rounded-full border border-rose-500/30 bg-rose-500/[0.08] text-rose-200 text-sm font-medium hover:bg-rose-500/[0.16] transition-colors"
          >
            Desactivar 2FA
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-5 space-y-3"
    >
      <div>
        <div className="font-medium text-rose-200">
          Confirma con tu código 2FA
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          Introduce un código actual de tu autenticador para desactivar 2FA.
        </div>
      </div>
      <input
        name="token"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
        placeholder="123456"
        className="w-full h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-base font-mono tracking-[0.3em] text-center outline-none focus:border-rose-400/40 transition-colors"
      />
      {state?.ok === false && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {state.error}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setArmed(false)}
          disabled={pending}
          className="h-9 px-4 rounded-full border border-white/15 text-sm font-medium hover:bg-white/[0.04] transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-9 px-4 rounded-full bg-rose-500 text-black text-sm font-semibold hover:bg-rose-400 transition-colors disabled:opacity-40"
        >
          {pending ? "Desactivando…" : "Desactivar"}
        </button>
      </div>
    </form>
  );
}

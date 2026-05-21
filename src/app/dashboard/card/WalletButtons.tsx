"use client";

import { useEffect, useState } from "react";

type Wallet = "apple" | "google";

export function WalletButtons({ last4 }: { last4: string }) {
  const [status, setStatus] = useState<{
    wallet: Wallet;
    state: "loading" | "done";
  } | null>(null);

  useEffect(() => {
    if (status?.state === "loading") {
      const t = setTimeout(
        () => setStatus({ wallet: status.wallet, state: "done" }),
        1100
      );
      return () => clearTimeout(t);
    }
    if (status?.state === "done") {
      const t = setTimeout(() => setStatus(null), 3500);
      return () => clearTimeout(t);
    }
  }, [status]);

  const add = (wallet: Wallet) => {
    if (status?.state === "loading") return;
    setStatus({ wallet, state: "loading" });
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
        Añadir a wallet
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => add("apple")}
          disabled={status?.state === "loading"}
          aria-label="Añadir a Apple Wallet"
          className="group inline-flex items-center justify-center gap-2.5 h-12 rounded-xl bg-black border border-white/15 hover:border-white/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <AppleLogo />
          <div className="text-left leading-tight">
            <div className="text-[9px] text-zinc-300 uppercase tracking-wider">
              Add to
            </div>
            <div className="text-sm font-semibold text-white">
              Apple Wallet
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => add("google")}
          disabled={status?.state === "loading"}
          aria-label="Añadir a Google Wallet"
          className="group inline-flex items-center justify-center gap-2.5 h-12 rounded-xl bg-black border border-white/15 hover:border-white/25 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <GoogleGLogo />
          <div className="text-left leading-tight">
            <div className="text-[9px] text-zinc-300 uppercase tracking-wider">
              Add to
            </div>
            <div className="text-sm font-semibold text-white">
              Google Wallet
            </div>
          </div>
        </button>
      </div>

      {status && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs flex items-center gap-2 transition-colors ${
            status.state === "loading"
              ? "border-white/10 bg-white/[0.02] text-zinc-400"
              : "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200"
          }`}
        >
          {status.state === "loading" ? (
            <>
              <Spinner />
              Conectando con {walletLabel(status.wallet)}…
            </>
          ) : (
            <>
              <span className="text-emerald-400">✓</span>
              Tarjeta ••••{last4} enviada a {walletLabel(status.wallet)}.{" "}
              <span className="text-zinc-500">
                (demo · sin provisioning real)
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function walletLabel(w: Wallet) {
  return w === "apple" ? "Apple Wallet" : "Google Wallet";
}

function AppleLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="white"
      aria-hidden
    >
      <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.02-3.77-2.04-1.6-.16-3.13.94-3.95.94-.82 0-2.07-.92-3.41-.89-1.75.03-3.37 1.02-4.27 2.59-1.83 3.17-.47 7.86 1.31 10.43.87 1.26 1.9 2.67 3.25 2.62 1.31-.05 1.81-.85 3.39-.85 1.58 0 2.03.85 3.41.82 1.41-.02 2.3-1.28 3.16-2.55.99-1.46 1.4-2.88 1.43-2.95-.03-.01-2.74-1.05-2.77-4.21zM14.62 4.41c.72-.87 1.21-2.08 1.07-3.28-1.04.04-2.29.69-3.04 1.56-.67.77-1.26 2-1.1 3.18 1.16.09 2.34-.59 3.07-1.46z" />
    </svg>
  );
}

function GoogleGLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.4-1.07 2.59-2.25 3.39v2.82h3.62c2.12-1.97 3.34-4.88 3.34-8.45z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.06 0 5.62-1.01 7.49-2.74l-3.62-2.82c-1 .67-2.29 1.07-3.87 1.07-2.98 0-5.5-2.01-6.4-4.72H1.84v2.91C3.7 21.3 7.55 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.79c-.23-.67-.36-1.4-.36-2.13s.13-1.46.36-2.13V7.62H1.84A11.96 11.96 0 0 0 .57 12c0 1.94.46 3.78 1.27 5.38l3.76-2.59z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.67 0 3.17.58 4.36 1.7l3.21-3.21C17.61 1.51 15.05.5 12 .5 7.55.5 3.7 3.2 1.84 7.62l3.76 2.91C6.5 6.76 9.02 4.75 12 4.75z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin text-zinc-400"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

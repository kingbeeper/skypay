"use client";

import { useTransition } from "react";
import { toggleWatchlistAction } from "@/app/actions";

export function WatchlistStar({
  asset,
  watching,
}: {
  asset: string;
  watching: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fd = new FormData();
    fd.append("asset", asset);
    startTransition(() => toggleWatchlistAction(fd));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={watching ? "Quitar de favoritos" : "Añadir a favoritos"}
      title={watching ? "Quitar de favoritos" : "Añadir a favoritos"}
      className={`h-8 w-8 inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
        watching
          ? "text-amber-300 hover:bg-amber-400/[0.08]"
          : "text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04]"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={watching ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  );
}

"use client";

import { useRouter, usePathname } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // No back button on the dashboard root — there's nowhere to go "back" to
  // within the app from there.
  if (pathname === "/dashboard") return null;

  const handleBack = () => {
    // Prefer browser history when there is something to go back to (typical
    // in-app navigation). Fall back to the dashboard root for direct loads
    // (new tab, deep link) where history would otherwise leave the site.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <button
      type="button"
      aria-label="Volver"
      onClick={handleBack}
      className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition-colors shrink-0"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </button>
  );
}

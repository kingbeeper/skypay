"use client";

export function ReplayTourButton() {
  const handleClick = () => {
    try {
      localStorage.removeItem("skypay-onboarding-done");
    } catch {
      // ignore
    }
    window.location.href = "/dashboard";
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="h-9 px-4 rounded-full border border-white/15 bg-white/[0.02] text-sm font-medium hover:bg-white/[0.04] transition-colors"
    >
      Ver tour de bienvenida
    </button>
  );
}

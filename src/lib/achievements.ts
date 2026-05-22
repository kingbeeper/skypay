import { prisma } from "./db";
import { notify } from "./notifications";

export type AchievementDef = {
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    code: "first_deposit",
    title: "Primer depósito",
    description: "Diste el primer paso. Tu cuenta tiene fondos.",
    icon: "↓",
    color: "#34d399",
  },
  {
    code: "first_swap",
    title: "Primer swap",
    description: "Convertiste entre activos por primera vez.",
    icon: "↔",
    color: "#22d3ee",
  },
  {
    code: "first_card",
    title: "Tarjeta emitida",
    description: "Solicitaste tu Visa virtual.",
    icon: "$",
    color: "#818cf8",
  },
  {
    code: "first_ticket",
    title: "Player de la rifa",
    description: "Compraste tu primer ticket.",
    icon: "★",
    color: "#fbbf24",
  },
  {
    code: "first_send",
    title: "Cripto enviado",
    description: "Hiciste tu primer envío on-chain.",
    icon: "↑",
    color: "#f472b6",
  },
  {
    code: "first_p2p",
    title: "Pago entre amigos",
    description: "Hiciste tu primer P2P a otro usuario.",
    icon: "✦",
    color: "#a78bfa",
  },
  {
    code: "raffle_winner",
    title: "Ganador de rifa",
    description: "Ganaste 1 BTC en la rifa mensual.",
    icon: "🏆",
    color: "#f59e0b",
  },
  {
    code: "streak_7",
    title: "Racha de 7 días",
    description: "Iniciaste sesión 7 días seguidos.",
    icon: "🔥",
    color: "#ef4444",
  },
];

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.code, a]));

/**
 * Grants an achievement to a user if they don't already have it. Idempotent.
 * Fires a notification on grant.
 */
export async function grantAchievement(userId: string, code: string) {
  const def = ACHIEVEMENT_MAP.get(code);
  if (!def) return;

  try {
    await prisma.achievement.create({
      data: { userId, code },
    });
    await notify({
      userId,
      type: "achievement",
      title: `Logro desbloqueado · ${def.title}`,
      body: def.description,
      link: "/dashboard/settings",
    });
  } catch {
    // unique constraint → already granted, ignore
  }
}

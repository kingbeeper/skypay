import { prisma } from "./db";

export const TICKET_PRICE_USD = 20;
export const PRIZE_BTC = 1;

const SYNTHETIC_MIN = 2000;
const SYNTHETIC_MAX = 8000;

export function nextDrawDate(from = new Date()): Date {
  // First day of the next calendar month, 00:00 UTC
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0));
}

function randomSyntheticTickets(): number {
  return Math.floor(SYNTHETIC_MIN + Math.random() * (SYNTHETIC_MAX - SYNTHETIC_MIN));
}

function randomHandle(): string {
  const hex = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
  return `usuario_0x${hex}`;
}

export async function getOrCreateCurrentRound() {
  const now = new Date();
  const open = await prisma.raffleRound.findFirst({
    where: { status: "open" },
    orderBy: { drawsAt: "asc" },
  });
  if (open) return open;

  return prisma.raffleRound.create({
    data: {
      drawsAt: nextDrawDate(now),
      prizeBtc: PRIZE_BTC,
      ticketPriceUsd: TICKET_PRICE_USD,
      syntheticTickets: randomSyntheticTickets(),
      status: "open",
    },
  });
}

export async function getUserEntry(roundId: string, userId: string) {
  return prisma.raffleEntry.findUnique({
    where: { roundId_userId: { roundId, userId } },
  });
}

export async function getRecentDrawnRounds(limit = 5) {
  return prisma.raffleRound.findMany({
    where: { status: "drawn" },
    orderBy: { drawnAt: "desc" },
    take: limit,
    include: { winner: { select: { id: true, email: true, name: true } } },
  });
}

export async function getRoundStats(roundId: string) {
  const agg = await prisma.raffleEntry.aggregate({
    where: { roundId },
    _sum: { tickets: true },
  });
  return { userTotalTickets: agg._sum.tickets ?? 0 };
}

export type DrawResult =
  | {
      kind: "user";
      userId: string;
      userTickets: number;
      totalTickets: number;
      winningIndex: number;
    }
  | {
      kind: "synthetic";
      handle: string;
      totalTickets: number;
      winningIndex: number;
    };

export type LeaderboardEntry = {
  rank: number;
  label: string;
  tickets: number;
  isUser: boolean;
};

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function syntheticHandleFrom(rng: () => number): string {
  const hex = Math.floor(rng() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return `usuario_0x${hex}`;
}

export function buildLeaderboard(
  realEntries: { label: string; tickets: number; isUser: boolean }[],
  syntheticTickets: number,
  roundId: string,
  topN = 10
): LeaderboardEntry[] {
  const rng = createRng(fnv1a(roundId));

  // 12 synthetic "top buyers"; allocate ~55% of the synthetic pool to them with
  // a skewed distribution so the leaderboard feels realistic. Remaining 45%
  // represents the long-tail of small buyers (not shown).
  const COUNT = 12;
  const topPool = Math.floor(syntheticTickets * 0.55);
  const ratios: number[] = [];
  let remaining = 1;
  for (let i = 0; i < COUNT; i++) {
    const slice = remaining * (0.15 + rng() * 0.25);
    ratios.push(slice);
    remaining = Math.max(0, remaining - slice);
  }
  const ratioSum = ratios.reduce((s, r) => s + r, 0) || 1;
  const synthetic = ratios.map((r) => ({
    label: syntheticHandleFrom(rng),
    tickets: Math.max(1, Math.floor((r / ratioSum) * topPool)),
    isUser: false,
  }));

  const combined = [...realEntries, ...synthetic];
  combined.sort((a, b) => b.tickets - a.tickets);
  return combined.slice(0, topN).map((e, i) => ({ rank: i + 1, ...e }));
}

export function pickWinner(
  entries: { userId: string; tickets: number }[],
  syntheticTickets: number
): DrawResult {
  const totalUserTickets = entries.reduce((s, e) => s + e.tickets, 0);
  const total = totalUserTickets + syntheticTickets;
  if (total === 0) {
    return {
      kind: "synthetic",
      handle: randomHandle(),
      totalTickets: 0,
      winningIndex: 0,
    };
  }
  const winningIndex = Math.floor(Math.random() * total);
  let cursor = 0;
  for (const e of entries) {
    if (winningIndex < cursor + e.tickets) {
      return {
        kind: "user",
        userId: e.userId,
        userTickets: e.tickets,
        totalTickets: total,
        winningIndex,
      };
    }
    cursor += e.tickets;
  }
  return {
    kind: "synthetic",
    handle: randomHandle(),
    totalTickets: total,
    winningIndex,
  };
}

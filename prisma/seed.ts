import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const MERCHANTS = [
  { name: "Starbucks Reserve", category: "coffee", min: 4, max: 9 },
  { name: "Whole Foods Market", category: "groceries", min: 35, max: 110 },
  { name: "Uber", category: "transport", min: 8, max: 32 },
  { name: "Netflix", category: "entertainment", min: 16, max: 16 },
  { name: "Apple Store", category: "online", min: 9, max: 299 },
  { name: "Shell Gas", category: "transport", min: 28, max: 65 },
  { name: "Chipotle", category: "food", min: 12, max: 22 },
  { name: "Amazon", category: "online", min: 14, max: 180 },
  { name: "Spotify", category: "entertainment", min: 10, max: 10 },
  { name: "AWS", category: "online", min: 22, max: 95 },
];

function randomAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function generatePan(): { pan: string; last4: string } {
  // Visa test BIN 4242, recognizable demo number
  const middle = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const last4 = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  return { pan: `4242${middle}${last4}`, last4 };
}

async function main() {
  const demoEmail = "demo@skypay.app";
  const demoPassword = "demo1234";
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // Clean up legacy demo user from before the rebrand
  await prisma.user.deleteMany({ where: { email: "demo@kairos.app" } });

  const demoUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash, isDemo: true, isAdmin: true, kycStatus: "approved" },
    create: {
      email: demoEmail,
      passwordHash,
      name: "Demo Investor",
      isDemo: true,
      isAdmin: true,
      kycStatus: "approved",
    },
  });

  const seedBalances: Array<{ asset: string; amount: number }> = [
    { asset: "USD", amount: 5000 },
    { asset: "BTC", amount: 0.05 },
    { asset: "ETH", amount: 1.2 },
    { asset: "USDC", amount: 1000 },
    { asset: "SOL", amount: 10 },
  ];

  for (const b of seedBalances) {
    await prisma.balance.upsert({
      where: { userId_asset: { userId: demoUser.id, asset: b.asset } },
      update: { amount: b.amount },
      create: { userId: demoUser.id, asset: b.asset, amount: b.amount },
    });
  }

  // Card: ensure exactly one demo card for demo user
  const existingCards = await prisma.card.findMany({
    where: { userId: demoUser.id },
  });
  for (const c of existingCards) {
    await prisma.cardTransaction.deleteMany({ where: { cardId: c.id } });
    await prisma.card.delete({ where: { id: c.id } });
  }

  const { pan, last4 } = generatePan();
  const card = await prisma.card.create({
    data: {
      userId: demoUser.id,
      type: "virtual",
      status: "active",
      pan,
      last4,
      expMonth: 12,
      expYear: new Date().getFullYear() + 4,
      cvv: String(Math.floor(100 + Math.random() * 900)),
      holderName: "DEMO INVESTOR",
      spendingSource: "USD",
      monthlyLimit: 2000,
      physicalRequested: false,
    },
  });

  // Seed 8 mock card transactions across the last 30 days
  for (let i = 0; i < 8; i++) {
    const m = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
    const amountUsd = randomAmount(m.min, m.max);
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    await prisma.cardTransaction.create({
      data: {
        cardId: card.id,
        merchant: m.name,
        category: m.category,
        amountUsd,
        sourceAsset: "USD",
        sourceAmount: amountUsd,
        rate: 1,
        status: "approved",
        createdAt,
      },
    });
  }

  // Raffle: reset + seed a fresh open round and a few past drawn rounds
  await prisma.raffleEntry.deleteMany({});
  await prisma.raffleRound.deleteMany({});

  function randomHandle() {
    const hex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
    return `usuario_0x${hex}`;
  }

  // Past 3 months of drawn rounds, all synthetic winners
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const drawsAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1)
    );
    const drawnAt = new Date(drawsAt.getTime() + 1000 * 60 * 60 * 6);
    const synthetic = Math.floor(2000 + Math.random() * 6000);
    await prisma.raffleRound.create({
      data: {
        drawsAt,
        prizeBtc: 1,
        ticketPriceUsd: 20,
        syntheticTickets: synthetic,
        status: "drawn",
        winnerHandle: randomHandle(),
        winnerTickets: Math.floor(Math.random() * synthetic),
        totalTicketsAtDraw: synthetic,
        drawnAt,
      },
    });
  }

  // Current open round, draws first of next month
  const nextMonthFirst = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  await prisma.raffleRound.create({
    data: {
      drawsAt: nextMonthFirst,
      prizeBtc: 1,
      ticketPriceUsd: 20,
      syntheticTickets: Math.floor(2000 + Math.random() * 6000),
      status: "open",
    },
  });

  console.log(`Seeded demo user: ${demoEmail} / ${demoPassword}`);
  console.log(`Seeded card: 4242 •••• •••• ${last4}`);
  console.log(`Seeded raffle: open round draws ${nextMonthFirst.toISOString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

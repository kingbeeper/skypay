import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("unauthorized", { status: 401 });

  const [txs, cardTxs] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cardTransaction.findMany({
      where: { card: { userId: user.id } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const headers = [
    "date_iso",
    "kind",
    "type",
    "from_asset",
    "from_amount",
    "to_asset",
    "to_amount",
    "status",
    "description",
  ];

  const rows: string[] = [headers.join(",")];

  for (const t of txs) {
    rows.push(
      [
        t.createdAt.toISOString(),
        "wallet",
        t.type,
        t.fromAsset ?? "",
        t.fromAmount ?? "",
        t.toAsset ?? "",
        t.toAmount ?? "",
        t.status,
        t.description ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  for (const c of cardTxs) {
    rows.push(
      [
        c.createdAt.toISOString(),
        "card",
        "card_purchase",
        c.sourceAsset,
        c.sourceAmount,
        "USD",
        c.amountUsd,
        c.status,
        `${c.merchant} · ${c.category}`,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  const csv = rows.join("\n") + "\n";
  const filename = `skypay-transactions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

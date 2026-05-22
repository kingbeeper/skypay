import { requireUser } from "@/lib/auth";
import { fetchPrices } from "@/lib/prices";
import { LiveDashboard } from "./LiveDashboard";

export default async function DashboardPage() {
  const user = await requireUser();
  const initialPrices = await fetchPrices();

  const balances = user.balances.map((b) => ({
    asset: b.asset,
    amount: b.amount,
  }));

  return (
    <LiveDashboard
      balances={balances}
      initialPrices={initialPrices}
    />
  );
}

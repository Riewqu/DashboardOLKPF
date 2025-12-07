import { TransactionRow } from "./transactionParser";

export type AggregatedMetrics = {
  totalRevenue: number;
  totalFees: number;
  totalAdjustments: number;
  perDay: { date: string; revenue: number; fees: number; adjustments: number }[];
  trend: number[];
  trendDates: string[];
  totalTransactions: number;
};

export function aggregateTransactions(
  transactions: TransactionRow[],
  dateField: "order_date" | "payment_date" = "order_date",
  fallbackField?: "order_date" | "payment_date"
): AggregatedMetrics {
  let totalRevenue = 0;
  let totalFees = 0;
  let totalAdjustments = 0;
  const perDayMap = new Map<string, { revenue: number; fees: number; adjustments: number }>();

  transactions.forEach((tx) => {
    const rev = Number(tx.revenue || 0);
    const fee = Number(tx.fees || 0);
    const adj = Number(tx.adjustments || 0);

    totalRevenue += rev;
    totalFees += fee;
    totalAdjustments += adj;

    const dateValue = tx[dateField] ?? (fallbackField ? tx[fallbackField] : undefined);
    if (dateValue) {
      const date = String(dateValue);
      const existing = perDayMap.get(date) ?? { revenue: 0, fees: 0, adjustments: 0 };
      perDayMap.set(date, {
        revenue: existing.revenue + rev,
        fees: existing.fees + fee,
        adjustments: existing.adjustments + adj
      });
    }
  });

  const perDay = Array.from(perDayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, ...v }));

  const last7 = perDay.slice(-7);
  const trend = last7.map((d) => d.revenue + d.fees + d.adjustments);
  const trendDates = last7.map((d) => d.date);

  return {
    totalRevenue,
    totalFees,
    totalAdjustments,
    perDay,
    trend,
    trendDates,
    totalTransactions: transactions.length
  };
}

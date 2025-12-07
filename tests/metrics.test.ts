import { aggregateTransactions } from "@/lib/metrics";
import { TransactionRow } from "@/lib/transactionParser";

const baseTx = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  platform: "TikTok",
  external_id: "order",
  sku: "sku",
  type: "Order",
  order_date: "2024-01-01",
  revenue: 0,
  fees: 0,
  adjustments: 0,
  settlement: 0,
  raw_data: {},
  ...overrides
});

describe("aggregateTransactions", () => {
  it("aggregates more than 1000 rows without losing totals", () => {
    const rows: TransactionRow[] = Array.from({ length: 1205 }, (_, idx) =>
      baseTx({
        external_id: `order-${idx}`,
        order_date: `2024-01-${String((idx % 28) + 1).padStart(2, "0")}`,
        revenue: 10,
        fees: -2,
        adjustments: 1
      })
    );

    const result = aggregateTransactions(rows);
    expect(result.totalTransactions).toBe(1205);
    expect(result.totalRevenue).toBe(12050);
    expect(result.totalFees).toBe(-2410);
    expect(result.totalAdjustments).toBe(1205);
    expect(result.perDay.length).toBe(28);
    expect(result.trendDates.length).toBeLessThanOrEqual(7);
  });

  it("skips null order_date from per-day buckets", () => {
    const rows: TransactionRow[] = [
      baseTx({ external_id: "a", order_date: "2024-02-01", revenue: 100 }),
      baseTx({ external_id: "b", order_date: null, revenue: 50 }),
      baseTx({ external_id: "c", order_date: "2024-02-02", revenue: 25 })
    ];

    const result = aggregateTransactions(rows);
    expect(result.perDay.map((d) => d.date)).toEqual(["2024-02-01", "2024-02-02"]);
    expect(result.totalTransactions).toBe(3);
    expect(result.totalRevenue).toBe(175);
  });

  it("aggregates using payment_date when requested", () => {
    const rows: TransactionRow[] = [
      baseTx({ external_id: "a", order_date: "2024-03-01", payment_date: "2024-03-05", revenue: 100 }),
      baseTx({ external_id: "b", order_date: "2024-03-02", payment_date: "2024-03-05", revenue: 50 })
    ];

    const result = aggregateTransactions(rows, "payment_date");
    expect(result.perDay).toHaveLength(1);
    expect(result.perDay[0].date).toBe("2024-03-05");
    expect(result.totalTransactions).toBe(2);
  });
});

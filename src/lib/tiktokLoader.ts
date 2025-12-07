import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type TikTokSummary = {
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  trend: number[];
  trendDates: string[];
  rows: number;
  breakdown: Record<string, number>;
  perDay: { date: string; revenue: number; fees: number; adjustments: number }[];
  feeGroups?: { title: string; items: { label: string; value: number }[] }[];
  revenueGroups?: { title: string; items: { label: string; value: number; children?: { label: string; value: number }[] }[] }[];
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const normalizeDate = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim()) return new Date(value).toISOString().slice(0, 10);
  return undefined;
};

export function loadTikTokFromExcel(): TikTokSummary | null {
  try {
    const filePath = path.join(process.cwd(), "data", "tiktok.xlsx");
    const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

  const revenueCols = ["Subtotal before discounts", "Seller discounts", "Refund subtotal after seller discounts"];
    const feeCols = [
      "Transaction fee",
      "TikTok Shop commission fee",
      "Credit card installment - Interest rate cost",
      "Seller shipping fee",
      "Affiliate Commission",
      "Affiliate partner commission",
      "Affiliate Shop Ads commission",
      "Affiliate commission deposit",
      "Affiliate commission refund",
      "Affiliate Partner shop ads commission",
      "SFP service fee",
      "Bonus cashback service fee",
      "LIVE Specials service fee",
      "Voucher Xtra service fee",
      "EAMS Program service fee",
      "Brands Crazy Deals/Flash Sale service fee",
      "TikTok PayLater program fee",
    "Commerce growth fee",
    "Infrastructure fee",
    "Campaign resource fee"
  ];
  const sellerShippingParts = [
    "Actual shipping fee",
    "Platform shipping fee discount",
    "Customer shipping fee",
    "Actual return shipping fee",
    "Refunded customer shipping fee",
    "Shipping subsidy"
  ];
  const affiliateParts = [
    "Affiliate commission before PIT (personal income tax)",
    "Personal income tax withheld from affiliate commission"
  ];
  const affiliateShopAdsParts = [
    "Affiliate Shop Ads commission before PIT",
    "Personal income tax withheld from affiliate Shop Ads commission"
  ];
  const adjustmentCols = ["Ajustment amount"];
  const dateCol = "Order created time";

    let revenue = 0;
  let fees = 0;
  let adjustments = 0;
  const perDay = new Map<string, { revenue: number; fees: number; adjustments: number }>();
  const breakdown: Record<string, number> = {};
  const sellerShippingDetail: Record<string, number> = {};
  const affiliateDetail: Record<string, number> = {};
  const affiliateShopAdsDetail: Record<string, number> = {};
  const revenueDetail = {
    subtotalBefore: 0,
    sellerDiscounts: 0,
    subtotalAfter: 0,
    refundSubtotalBefore: 0,
    refundSellerDiscounts: 0,
    refundSubtotalAfter: 0
  };

  for (const row of rows) {
    const subtotalBefore = toNumber(row["Subtotal before discounts"]);
    const sellerDiscounts = toNumber(row["Seller discounts"]);
    const refundSubtotalBefore = toNumber(row["Refund subtotal before seller discounts"]);
    const refundSellerDiscounts = toNumber(row["Refund of seller discounts"]);

    revenueDetail.subtotalBefore += subtotalBefore;
    revenueDetail.sellerDiscounts += sellerDiscounts;
    revenueDetail.subtotalAfter += subtotalBefore + sellerDiscounts;
    revenueDetail.refundSubtotalBefore += refundSubtotalBefore;
    revenueDetail.refundSellerDiscounts += refundSellerDiscounts;
    revenueDetail.refundSubtotalAfter += refundSubtotalBefore + refundSellerDiscounts;

    const revLine = revenueCols.reduce((sum, key) => sum + toNumber(row[key]), 0);
    const feeLine = feeCols.reduce((sum, key) => {
      const val = toNumber(row[key]);
      breakdown[key] = (breakdown[key] ?? 0) + val;
      return sum + val;
    }, 0);
    const sellerShippingSum = sellerShippingParts.reduce((sum, key) => {
      const val = toNumber(row[key]);
      sellerShippingDetail[key] = (sellerShippingDetail[key] ?? 0) + val;
      return sum + val;
    }, 0);
    if (sellerShippingSum !== 0) {
      breakdown["Seller shipping fee"] = (breakdown["Seller shipping fee"] ?? 0) + sellerShippingSum;
    }
    const affiliateSum = affiliateParts.reduce((sum, key) => {
      const val = toNumber(row[key]);
      affiliateDetail[key] = (affiliateDetail[key] ?? 0) + val;
      return sum + val;
    }, 0);
    if (affiliateSum !== 0) {
      breakdown["Affiliate Commission"] = (breakdown["Affiliate Commission"] ?? 0) + affiliateSum;
    }
    const affiliateShopAdsSum = affiliateShopAdsParts.reduce((sum, key) => {
      const val = toNumber(row[key]);
      affiliateShopAdsDetail[key] = (affiliateShopAdsDetail[key] ?? 0) + val;
      return sum + val;
    }, 0);
    if (affiliateShopAdsSum !== 0) {
      breakdown["Affiliate Shop Ads commission"] =
        (breakdown["Affiliate Shop Ads commission"] ?? 0) + affiliateShopAdsSum;
    }
    const adjLine = adjustmentCols.reduce((sum, key) => sum + toNumber(row[key]), 0);

    revenue += revLine;
    fees += feeLine;
    adjustments += adjLine;

      const date = normalizeDate(row[dateCol]);
      if (date) {
        const existing = perDay.get(date) ?? { revenue: 0, fees: 0, adjustments: 0 };
        perDay.set(date, {
          revenue: existing.revenue + revLine,
          fees: existing.fees + feeLine,
          adjustments: existing.adjustments + adjLine
        });
      }
    }

    const settlement = revenue + fees + adjustments;
    const sortedDates = Array.from(perDay.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
    const last7 = sortedDates.slice(-7);

    return {
      revenue,
      fees,
      adjustments,
      settlement,
      rows: rows.length,
      trendDates: last7.map(([d]) => d),
      trend: last7.map(([, v]) => v.revenue + v.fees + v.adjustments),
      breakdown,
      perDay: sortedDates.map(([date, vals]) => ({
        date,
        revenue: vals.revenue,
        fees: vals.fees,
        adjustments: vals.adjustments
      })),
      feeGroups: [
        {
          title: "ค่าธรรมเนียม (TikTok)",
          items: Object.entries(breakdown).map(([label, value]) => {
            if (label === "Seller shipping fee") {
              return {
                label,
                value,
                children: sellerShippingParts.map((part) => ({
                  label: part,
                  value: sellerShippingDetail[part] ?? 0
                }))
              };
            }
            if (label === "Affiliate Commission") {
              return {
                label,
                value,
                children: affiliateParts.map((part) => ({
                  label: part,
                  value: affiliateDetail[part] ?? 0
                }))
              };
            }
            if (label === "Affiliate Shop Ads commission") {
              return {
                label,
                value,
                children: affiliateShopAdsParts.map((part) => ({
                  label: part,
                  value: affiliateShopAdsDetail[part] ?? 0
                }))
              };
            }
            return { label, value };
          })
        }
      ],
      revenueGroups: [
        {
          title: "รายได้ (TikTok)",
          items: [
            {
              label: "Subtotal after seller discounts",
              value: revenueDetail.subtotalAfter,
              children: [
                { label: "Subtotal before discounts", value: revenueDetail.subtotalBefore },
                { label: "Seller discounts", value: revenueDetail.sellerDiscounts }
              ]
            },
            {
              label: "Refund subtotal after seller discounts",
              value: revenueDetail.refundSubtotalAfter,
              children: [
                { label: "Refund subtotal before seller discounts", value: revenueDetail.refundSubtotalBefore },
                { label: "Refund of seller discounts", value: revenueDetail.refundSellerDiscounts }
              ]
            }
          ]
        }
      ]
    };
  } catch (err) {
    console.error("loadTikTokFromExcel error:", err);
    return null;
  }
}

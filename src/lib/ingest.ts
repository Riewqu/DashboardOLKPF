import * as XLSX from "xlsx";

export type PlatformMetrics = {
  platform: "TikTok" | "Shopee" | "Lazada";
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  trend: number[];
  trendDates: string[];
  perDay: { date: string; revenue: number; fees: number; adjustments: number }[];
  breakdown: Record<string, number>;
  feeGroups: { title: string; items: { label: string; value: number; children?: { label: string; value: number }[] }[] }[];
  revenueGroups: { title: string; items: { label: string; value: number; children?: { label: string; value: number }[] }[] }[];
  rows: number;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeDate = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return undefined;
};

export function computeFromBuffer(platform: "TikTok" | "Shopee" | "Lazada", buffer: Buffer): PlatformMetrics {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: 0 });
  switch (platform) {
    case "Shopee":
      return computeShopee(rows);
    case "Lazada":
      return computeLazada(rows);
    case "TikTok":
    default:
      return computeTikTok(rows);
  }
}

function computeShopee(rows: Record<string, unknown>[]): PlatformMetrics {
  const dateCol = "วันที่ทำการสั่งซื้อ";
  const perDayMap = new Map<string, { revenue: number; fees: number; adjustments: number }>();

  const salesCols = ["สินค้าราคาปกติ", "ส่วนลดสินค้าจากผู้ขาย", "จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"];
  const discountCols = ["ส่วนลดสินค้าที่ออกโดย Shopee", "โค้ดส่วนลดที่ออกโดยผู้ขาย", "Coins Cashback ที่สนับสนุนโดยผู้ขาย"];
  const shippingCols = ["ค่าจัดส่งที่ชำระโดยผู้ซื้อ", "ค่าจัดส่งสินค้าที่ออกโดย Shopee", "ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ", "ค่าจัดส่งสินค้าคืน", "โปรแกรมประหยัดค่าจัดส่งคืนสินค้า", "ค่าจัดส่งสินค้าคืนผู้ขาย"];
  const feeCols = ["ค่าคอมมิชชั่น AMS", "ค่าคอมมิชชั่น", "ค่าบริการ", "ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม", "ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง", "ค่าธุรกรรมการชำระเงิน"];
  const vasCols = ["ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ", "ค่าบริการติดตั้งจริงจากผู้ให้บริการ", "โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย"];

  let revenue = 0;
  let fees = 0;
  const breakdown: Record<string, number> = {};

  let productSales = 0;
  let sellerDiscounts = 0;
  let customerRefund = 0;
  let platformDiscount = 0;
  let sellerCodeDiscount = 0;
  let sellerCoins = 0;

  const shippingDetail = {
    buyerPaid: 0,
    byShopee: 0,
    shopeeNamed: 0,
    returnShipping: 0,
    shippingProgram: 0,
    sellerReturn: 0
  };
  const feeDetail = {
    commissionAms: 0,
    commission: 0,
    service: 0,
    infra: 0,
    shippingProgramFee: 0,
    payment: 0
  };
  const vasDetail = {
    installBuyer: 0,
    installActual: 0,
    tradeInBonus: 0
  };

  rows.forEach((row) => {
    const sale = salesCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const discount = discountCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const revenueLine = sale + discount;
    const shipping = shippingCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const fee = feeCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const vas = vasCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const expenseLine = shipping + fee + vas;

    revenue += revenueLine;
    fees += expenseLine;

    productSales += toNumber(row["สินค้าราคาปกติ"]);
    sellerDiscounts += toNumber(row["ส่วนลดสินค้าจากผู้ขาย"]);
    customerRefund += toNumber(row["จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"]);
    platformDiscount += toNumber(row["ส่วนลดสินค้าที่ออกโดย Shopee"]);
    sellerCodeDiscount += toNumber(row["โค้ดส่วนลดที่ออกโดยผู้ขาย"]);
    sellerCoins += toNumber(row["Coins Cashback ที่สนับสนุนโดยผู้ขาย"]);

    shippingDetail.buyerPaid += toNumber(row["ค่าจัดส่งที่ชำระโดยผู้ซื้อ"]);
    shippingDetail.byShopee += toNumber(row["ค่าจัดส่งสินค้าที่ออกโดย Shopee"]);
    shippingDetail.shopeeNamed += toNumber(row["ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ"]);
    shippingDetail.returnShipping += toNumber(row["ค่าจัดส่งสินค้าคืน"]);
    shippingDetail.shippingProgram += toNumber(row["โปรแกรมประหยัดค่าจัดส่งคืนสินค้า"]);
    shippingDetail.sellerReturn += toNumber(row["ค่าจัดส่งสินค้าคืนผู้ขาย"]);

    feeDetail.commissionAms += toNumber(row["ค่าคอมมิชชั่น AMS"]);
    feeDetail.commission += toNumber(row["ค่าคอมมิชชั่น"]);
    feeDetail.service += toNumber(row["ค่าบริการ"]);
    feeDetail.infra += toNumber(row["ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม"]);
    feeDetail.shippingProgramFee += toNumber(row["ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง"]);
    feeDetail.payment += toNumber(row["ค่าธุรกรรมการชำระเงิน"]);

    breakdown["ค่าจัดส่งที่ชำระโดยผู้ซื้อ (Shopee)"] = shippingDetail.buyerPaid;
    breakdown["ส่วนลด/ชำระค่าจัดส่งโดย Shopee"] = shippingDetail.byShopee + shippingDetail.shopeeNamed;
    breakdown["ค่าคอมมิชชั่นแพลตฟอร์ม (Shopee)"] = feeDetail.commissionAms + feeDetail.commission;
    breakdown["ค่าธุรกรรมการชำระเงิน (Shopee)"] = feeDetail.payment;

    const date = normalizeDate(row[dateCol]);
    if (date) {
      const existing = perDayMap.get(date) ?? { revenue: 0, fees: 0, adjustments: 0 };
      perDayMap.set(date, {
        revenue: existing.revenue + revenueLine,
        fees: existing.fees + expenseLine,
        adjustments: existing.adjustments
      });
    }
  });

  const adjustments = 0;
  const settlement = revenue + fees + adjustments;
  const perDay = Array.from(perDayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, ...v }));
  const last7 = perDay.slice(-7);

  const revenueGroups = [
    {
      title: "รายได้ (Shopee)",
      items: [
        {
          label: "ยอดขายสินค้า",
          value: productSales + sellerDiscounts + customerRefund,
          children: [
            { label: "สินค้าราคาปกติ", value: productSales },
            { label: "ส่วนลดสินค้าจากผู้ขาย", value: sellerDiscounts },
            { label: "จำนวนเงินที่ทำการคืนให้ผู้ซื้อ", value: customerRefund }
          ]
        },
        {
          label: "ส่วนลดและโค้ดของผู้ขาย",
          value: platformDiscount + sellerCodeDiscount + sellerCoins,
          children: [
            { label: "ส่วนลดสินค้าที่ออกโดย Shopee", value: platformDiscount },
            { label: "โค้ดส่วนลดที่ออกโดยผู้ขาย", value: sellerCodeDiscount },
            { label: "Coins Cashback ที่สนับสนุนโดยผู้ขาย", value: sellerCoins }
          ]
        }
      ]
    }
  ];

  const feeGroups = [
    {
      title: "ค่าจัดส่ง",
      items: [
        { label: "ค่าจัดส่งที่ชำระโดยผู้ซื้อ", value: shippingDetail.buyerPaid },
        { label: "ค่าจัดส่งสินค้าที่ออกโดย Shopee", value: shippingDetail.byShopee },
        { label: "ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ", value: shippingDetail.shopeeNamed },
        { label: "ค่าจัดส่งสินค้าคืน", value: shippingDetail.returnShipping },
        { label: "โปรแกรมประหยัดค่าจัดส่งคืนสินค้า", value: shippingDetail.shippingProgram },
        { label: "ค่าจัดส่งสินค้าคืนผู้ขาย", value: shippingDetail.sellerReturn }
      ]
    },
    {
      title: "ค่าธรรมเนียม",
      items: [
        { label: "ค่าคอมมิชชั่น AMS", value: feeDetail.commissionAms },
        { label: "ค่าคอมมิชชั่น", value: feeDetail.commission },
        { label: "ค่าบริการ", value: feeDetail.service },
        { label: "ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม", value: feeDetail.infra },
        { label: "ค่าธรรมเนียมโปรแกรมประหยัดค่าจัดส่ง", value: feeDetail.shippingProgramFee },
        { label: "ค่าธุรกรรมการชำระเงิน", value: feeDetail.payment }
      ]
    },
    {
      title: "บริการเสริม",
      items: [
        { label: "ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ", value: vasDetail.installBuyer },
        { label: "ค่าบริการติดตั้งจริงจากผู้ให้บริการ", value: vasDetail.installActual },
        { label: "โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย", value: vasDetail.tradeInBonus }
      ]
    }
  ];

  return {
    platform: "Shopee",
    revenue,
    fees,
    adjustments,
    settlement,
    trend: last7.map((d) => d.revenue + d.fees + d.adjustments),
    trendDates: last7.map((d) => d.date),
    perDay,
    breakdown,
    feeGroups,
    revenueGroups,
    rows: rows.length
  };
}

function computeLazada(rows: Record<string, unknown>[]): PlatformMetrics {
  const nameCol = "ชื่อรายการธุรกรรม";
  const amountCol = "จำนวนเงิน(รวมภาษี)";
  const dateCol = "วันที่สร้างคำสั่งซื้อ";
  const revenueKeys = ["ยอดรวมค่าสินค้า", "คืนส่วนลดค่าธรรมเนียมการขายสินค้า"];
  const expenseKeys = ["หักค่าธรรมเนียมการขายสินค้า", "ค่าธรรมเนียมการชำระเงิน", "ส่วนลดค่าขนส่ง จ่ายโดยร้านค้า", "ส่วนต่างค่าจัดส่ง"];

  let revenue = 0;
  let fees = 0;
  const perDay = new Map<string, { revenue: number; fees: number; adjustments: number }>();
  const breakdown: Record<string, number> = {};
  const revenueMap = new Map<string, number>();

  rows.forEach((row) => {
    const name = String(row[nameCol] ?? "").trim();
    const amount = toNumber(row[amountCol]);
    if (revenueKeys.includes(name)) {
      revenue += amount;
      revenueMap.set(name, (revenueMap.get(name) ?? 0) + amount);
    }
    if (expenseKeys.includes(name)) {
      fees += amount;
      breakdown[name] = (breakdown[name] ?? 0) + amount;
    }
    const date = normalizeDate(row[dateCol]);
    if (date) {
      const existing = perDay.get(date) ?? { revenue: 0, fees: 0, adjustments: 0 };
      perDay.set(date, {
        revenue: existing.revenue + (revenueKeys.includes(name) ? amount : 0),
        fees: existing.fees + (expenseKeys.includes(name) ? amount : 0),
        adjustments: existing.adjustments
      });
    }
  });

  const adjustments = 0;
  const settlement = revenue + fees + adjustments;
  const perDayArr = Array.from(perDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, ...v }));
  const last7 = perDayArr.slice(-7);

  return {
    platform: "Lazada",
    revenue,
    fees,
    adjustments,
    settlement,
    trend: last7.map((d) => d.revenue + d.fees + d.adjustments),
    trendDates: last7.map((d) => d.date),
    perDay: perDayArr,
    breakdown,
    feeGroups: [
      {
        title: "ค่าธรรมเนียม (Lazada)",
        items: Object.entries(breakdown).map(([label, value]) => ({ label, value }))
      }
    ],
    revenueGroups: [
      {
        title: "รายได้ (Lazada)",
        items: [
          {
            label: "รายได้รวม",
            value: revenue,
            children: Array.from(revenueMap.entries()).map(([label, value]) => ({ label, value }))
          }
        ]
      }
    ],
    rows: rows.length
  };
}

function computeTikTok(rows: Record<string, unknown>[]): PlatformMetrics {
  const dateCol = "Order created time";
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
  const sellerShippingParts = ["Actual shipping fee", "Platform shipping fee discount", "Customer shipping fee", "Actual return shipping fee", "Refunded customer shipping fee", "Shipping subsidy"];
  const affiliateParts = ["Affiliate commission before PIT (personal income tax)", "Personal income tax withheld from affiliate commission"];
  const affiliateShopAdsParts = ["Affiliate Shop Ads commission before PIT", "Personal income tax withheld from affiliate Shop Ads commission"];
  const adjustmentCols = ["Ajustment amount"];

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

  let revenue = 0;
  let fees = 0;
  let adjustments = 0;

  rows.forEach((row) => {
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

    const revLine = revenueCols.reduce((s, c) => s + toNumber(row[c]), 0);
    revenue += revLine;

    const feeLine = feeCols.reduce((s, c) => {
      const val = toNumber(row[c]);
      breakdown[c] = (breakdown[c] ?? 0) + val;
      return s + val;
    }, 0);

    const sellerShippingSum = sellerShippingParts.reduce((s, c) => {
      const val = toNumber(row[c]);
      sellerShippingDetail[c] = (sellerShippingDetail[c] ?? 0) + val;
      return s + val;
    }, 0);
    if (sellerShippingSum !== 0) {
      breakdown["Seller shipping fee"] = (breakdown["Seller shipping fee"] ?? 0) + sellerShippingSum;
    }

    const affiliateSum = affiliateParts.reduce((s, c) => {
      const val = toNumber(row[c]);
      affiliateDetail[c] = (affiliateDetail[c] ?? 0) + val;
      return s + val;
    }, 0);
    if (affiliateSum !== 0) {
      breakdown["Affiliate Commission"] = (breakdown["Affiliate Commission"] ?? 0) + affiliateSum;
    }

    const affiliateShopAdsSum = affiliateShopAdsParts.reduce((s, c) => {
      const val = toNumber(row[c]);
      affiliateShopAdsDetail[c] = (affiliateShopAdsDetail[c] ?? 0) + val;
      return s + val;
    }, 0);
    if (affiliateShopAdsSum !== 0) {
      breakdown["Affiliate Shop Ads commission"] =
        (breakdown["Affiliate Shop Ads commission"] ?? 0) + affiliateShopAdsSum;
    }

    fees += feeLine;
    adjustments += adjustmentCols.reduce((s, c) => s + toNumber(row[c]), 0);

    const date = normalizeDate(row[dateCol]);
    if (date) {
      const existing = perDay.get(date) ?? { revenue: 0, fees: 0, adjustments: 0 };
      perDay.set(date, {
        revenue: existing.revenue + revLine,
        fees: existing.fees + feeLine,
        adjustments: existing.adjustments + adjustmentCols.reduce((s, c) => s + toNumber(row[c]), 0)
      });
    }
  });

  const settlement = revenue + fees + adjustments;
  const perDayArr = Array.from(perDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, ...v }));
  const last7 = perDayArr.slice(-7);

  const feeGroups = [
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
  ];

  const revenueGroups = [
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
  ];

  return {
    platform: "TikTok",
    revenue,
    fees,
    adjustments,
    settlement,
    trend: last7.map((d) => d.revenue + d.fees + d.adjustments),
    trendDates: last7.map((d) => d.date),
    perDay: perDayArr,
    breakdown,
    feeGroups,
    revenueGroups,
    rows: rows.length
  };
}

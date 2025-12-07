const fs = require("fs");

// Lightweight .env loader (to avoid extra dependency)
if (fs.existsSync(".env.local")) {
  const envLines = fs.readFileSync(".env.local", "utf8").split(/\r?\n/);
  envLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  });
}
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  let str = String(value).trim();
  str = str.replace(/[,\s฿$€£¥]/g, "");
  str = str.replace(/["']/g, "");
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
};

function aggregateTransactions(transactions, dateField = "order_date", fallbackField) {
  let totalRevenue = 0;
  let totalFees = 0;
  let totalAdjustments = 0;
  const perDayMap = new Map();

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
      const existing = perDayMap.get(date) || { revenue: 0, fees: 0, adjustments: 0 };
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

function aggregateBreakdown(allTx, platform) {
  const breakdown = {};
  const children = {};

  const addLabel = (label, value) => {
    const n = toNumber(value);
    if (n === 0) return;
    breakdown[label] = (breakdown[label] ?? 0) + n;
  };

  const addChild = (parent, child, value) => {
    const n = toNumber(value);
    if (n === 0) return;
    if (!children[parent]) children[parent] = {};
    children[parent][child] = (children[parent][child] ?? 0) + n;
  };

  const tikTokRevenue = ["Subtotal before discounts", "Seller discounts", "Refund subtotal after seller discounts"];
  const tikTokFees = [
    "Transaction fee", "TikTok Shop commission fee", "Credit card installment - Interest rate cost", "Seller shipping fee",
    "Affiliate Commission", "Affiliate partner commission", "Affiliate commission deposit", "Affiliate commission refund",
    "Affiliate Shop Ads commission", "Affiliate Partner shop ads commission", "SFP service fee", "Bonus cashback service fee",
    "LIVE Specials service fee", "Voucher Xtra service fee", "EAMS Program service fee", "Brands Crazy Deals/Flash Sale service fee",
    "TikTok PayLater program fee", "Commerce growth fee", "Infrastructure fee", "Campaign resource fee"
  ];
  const tikTokAdjustments = ["Ajustment amount"];

  const shopeeSales = ["สินค้าราคาปกติ", "ส่วนลดสินค้าจากผู้ขาย", "จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"];
  const shopeeDiscounts = ["ส่วนลดสินค้าที่ออกโดย Shopee", "โค้ดส่วนลดที่ออกโดยผู้ขาย", "Coins Cashback ที่สนับสนุนโดยผู้ขาย"];
  const shopeeShipping = ["ค่าจัดส่งที่ชำระโดยผู้ซื้อ", "ค่าจัดส่งสินค้าที่ออกโดย Shopee", "ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ", "ค่าจัดส่งสินค้าคืน", "โปรแกรมประหยัดค่าจัดส่งคืนสินค้า", "ค่าจัดส่งสินค้าคืนผู้ขาย"];
  const shopeeFees = ["ค่าคอมมิชชั่น AMS", "ค่าคอมมิชชั่น", "ค่าบริการ", "ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม", "ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง", "ค่าธุรกรรมการชำระเงิน"];
  const shopeeVas = ["ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ", "ค่าบริการติดตั้งจริงจากผู้ให้บริการ", "โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย"];

  const lazadaRevenue = ["ยอดรวมค่าสินค้า", "คืนส่วนลดค่าธรรมเนียมการขายสินค้า"];
  const lazadaFees = ["หักค่าธรรมเนียมการขายสินค้า", "ค่าธรรมเนียมการชำระเงิน", "ส่วนลดค่าขนส่ง จ่ายโดยร้านค้า", "ส่วนต่างค่าจัดส่ง"];
  const lazadaNameCol = "ชื่อรายการธุรกรรม";
  const lazadaAmountCol = "จำนวนเงิน(รวมภาษี)";

  const childMap = {
    TikTok: {
      "Seller shipping fee": [
        "Actual shipping fee",
        "Platform shipping fee discount",
        "Customer shipping fee",
        "Actual return shipping fee",
        "Refunded customer shipping fee",
        "Shipping subsidy"
      ],
      "Affiliate Commission": [
        "Affiliate commission before PIT (personal income tax)",
        "Personal income tax withheld from affiliate commission"
      ],
      "Affiliate Shop Ads commission": [
        "Affiliate Shop Ads commission before PIT",
        "Personal income tax withheld from affiliate Shop Ads commission"
      ],
      // Revenue parents
      "Subtotal after seller discounts": [
        "Subtotal before discounts",
        "Seller discounts"
      ],
      "Refund subtotal after seller discounts": [
        "Refund subtotal before seller discounts",
        "Refund of seller discounts"
      ]
    },
    Shopee: {
      "ค่าจัดส่งรวม (Shopee)": [
        "ค่าจัดส่งที่ชำระโดยผู้ซื้อ",
        "ส่วนลดค่าจัดส่งจากผู้ให้บริการขนส่ง",
        "ค่าจัดส่งสินค้าที่ออกโดย Shopee",
        "ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ",
        "ค่าจัดส่งสินค้าคืน",
        "โปรแกรมประหยัดค่าจัดส่งคืนสินค้า",
        "ค่าจัดส่งสินค้าคืนผู้ขาย"
      ],
      "ค่าธรรมเนียมรวม (Shopee)": [
        "ค่าคอมมิชชั่น AMS",
        "ค่าคอมมิชชั่น",
        "ค่าบริการ",
        "ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม",
        "ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง",
        "ค่าธุรกรรมการชำระเงิน"
      ],
      "ยอดรวมบริการเสริมเพิ่มมูลค่าสำหรับผู้ซื้อ": [
        "ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ",
        "ค่าบริการติดตั้งจริงจากผู้ให้บริการ",
        "โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย"
      ],
      // Revenue parents
      "ยอดขายสินค้า (Shopee)": [
        "สินค้าราคาปกติ",
        "ส่วนลดสินค้าจากผู้ขาย",
        "จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"
      ],
      "ส่วนลดและโค้ดของผู้ขาย": [
        "ส่วนลดสินค้าที่ออกโดย Shopee",
        "โค้ดส่วนลดที่ออกโดยผู้ขาย",
        "Coins Cashback ที่สนับสนุนโดยผู้ขาย"
      ]
    },
    Lazada: {
      "ค่าธรรมเนียมรวม (Lazada)": [
        "หักค่าธรรมเนียมการขายสินค้า",
        "ค่าธรรมเนียมการชำระเงิน",
        "ส่วนลดค่าขนส่ง จ่ายโดยร้านค้า",
        "ส่วนต่างค่าจัดส่ง"
      ]
    }
  };

  allTx.forEach((tx) => {
    const row = tx.raw_data || {};
    switch (platform) {
      case "TikTok":
        tikTokRevenue.forEach((label) => addLabel(label, row[label]));
        tikTokFees.forEach((label) => addLabel(label, row[label]));
        tikTokAdjustments.forEach((label) => addLabel(label, row[label]));
        Object.entries(childMap.TikTok || {}).forEach(([parent, childLabels]) => {
          childLabels.forEach((cl) => addChild(parent, cl, row[cl]));
        });
        break;
      case "Shopee":
        [...shopeeSales, ...shopeeDiscounts].forEach((label) => addLabel(label, row[label]));
        [...shopeeShipping, ...shopeeFees, ...shopeeVas].forEach((label) => addLabel(label, row[label]));
        Object.entries(childMap.Shopee || {}).forEach(([parent, childLabels]) => {
          childLabels.forEach((cl) => addChild(parent, cl, row[cl]));
        });
        break;
      case "Lazada":
        {
          const txName = String(row[lazadaNameCol] ?? "").trim();
          const txAmount = row[lazadaAmountCol];
          lazadaRevenue.forEach((label) => {
            if (txName === label) addLabel(label, txAmount);
          });
          lazadaFees.forEach((label) => {
            if (txName === label) addLabel(label, txAmount);
          });
          Object.entries(childMap.Lazada || {}).forEach(([parent, childLabels]) => {
            childLabels.forEach((cl) => {
              if (txName === cl) addChild(parent, cl, txAmount);
            });
          });
        }
        break;
      default:
        break;
    }
  });

  const buildGroup = (title, labels) => ({
    title,
    items: labels
      .map((label) => ({
        label,
        value: breakdown[label] ?? 0,
        children: children[label]
          ? Object.entries(children[label])
              .filter(([, v]) => v !== 0)
              .map(([cl, v]) => ({ label: cl, value: v }))
          : undefined
      }))
      .filter((item) => item.value !== 0)
  });

  // Derive parent totals from children (so parent shows even if base column missing)
  Object.entries(children).forEach(([parent, childObj]) => {
    const sum = Object.values(childObj).reduce((acc, v) => acc + v, 0);
    breakdown[parent] = sum;
  });

  let feeGroups = [];
  let revenueGroups = [];

  switch (platform) {
    case "TikTok":
      feeGroups = [buildGroup("ค่าธรรมเนียม (TikTok)", tikTokFees)];
      revenueGroups = [
        buildGroup("รายได้ (TikTok)", [
          "Subtotal after seller discounts",
          "Refund subtotal after seller discounts"
        ])
      ];
      break;
    case "Shopee":
      feeGroups = [
        buildGroup("ค่าธรรมเนียม (Shopee)", [
          "ค่าจัดส่งรวม (Shopee)",
          "ค่าธรรมเนียมรวม (Shopee)",
          "ยอดรวมบริการเสริมเพิ่มมูลค่าสำหรับผู้ซื้อ"
        ])
      ];
      revenueGroups = [
        buildGroup("รายได้ (Shopee)", [
          "ยอดขายสินค้า (Shopee)",
          "ส่วนลดและโค้ดของผู้ขาย"
        ])
      ];
      break;
    case "Lazada":
      feeGroups = [buildGroup("ค่าธรรมเนียม (Lazada)", ["ค่าธรรมเนียมรวม (Lazada)"])];
      revenueGroups = [buildGroup("รายได้ (Lazada)", lazadaRevenue)];
      break;
    default:
      break;
  }

  return { breakdown, feeGroups, revenueGroups };
}

async function recalc(platform) {
  console.log(`Recalculating metrics for ${platform}...`);
  const pageSize = 1000;
  let offset = 0;
  let fetched = 0;
  const allTx = [];

  const { count: totalCount, error: countError } = await supabase
    .from("transactions")
    .select("*", { head: true, count: "exact" })
    .eq("platform", platform);
  if (countError) {
    console.error("Count error", countError);
  }

  while (true) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("platform", platform)
      .order("order_date", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error("Fetch error", error);
      break;
    }
    if (!data || data.length === 0) break;
    allTx.push(...data);
    fetched += data.length;
    offset += pageSize;
    if (data.length < pageSize) break;
  }

  const aggregated = aggregateTransactions(allTx, "order_date");
  const aggregatedPaid = aggregateTransactions(allTx, "payment_date", "order_date");
  const breakdownAgg = aggregateBreakdown(allTx, platform);
  const effectiveCount = Math.max(totalCount ?? 0, fetched);

  const { error: metricsError } = await supabase
    .from("platform_metrics")
    .upsert({
      platform,
      revenue: aggregated.totalRevenue,
      fees: aggregated.totalFees,
      adjustments: aggregated.totalAdjustments,
      settlement: aggregated.totalRevenue + aggregated.totalFees + aggregated.totalAdjustments,
      trend: aggregated.trend,
      trend_dates: aggregated.trendDates,
      per_day: aggregated.perDay,
      per_day_paid: aggregatedPaid.perDay,
      breakdown: breakdownAgg.breakdown,
      fee_groups: breakdownAgg.feeGroups,
      revenue_groups: breakdownAgg.revenueGroups,
      total_transactions: effectiveCount,
      total_transactions_paid: aggregatedPaid.totalTransactions,
      updated_at: new Date().toISOString()
    }, { onConflict: "platform" });

  if (metricsError) {
    console.error(`Update metrics error for ${platform}`, metricsError);
  } else {
    console.log(`Updated metrics for ${platform}: revenue=${aggregated.totalRevenue.toFixed(2)} fees=${aggregated.totalFees.toFixed(2)}`);
  }
}

async function main() {
  const platforms = ["TikTok", "Shopee", "Lazada"];
  for (const p of platforms) {
    await recalc(p);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

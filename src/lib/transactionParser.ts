import * as XLSX from "xlsx";

// Transaction row ที่จะบันทึกลง Supabase
export type TransactionRow = {
  platform: "TikTok" | "Shopee" | "Lazada";
  external_id: string; // Order ID / หมายเลขคำสั่งซื้อ
  sku: string; // SKU ร้านค้า
  type: string; // Order/Adjustment (สำหรับ TikTok)
  order_date: string | null; // ISO date string (YYYY-MM-DD)
  payment_date?: string | null; // ISO date string (YYYY-MM-DD)
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  raw_data: Record<string, unknown>; // เก็บแถวดิบทั้งหมด
};

// Summary metrics (เหมือนเดิม - สำหรับ frontend)
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

// ผลลัพธ์จาก parser
export type ParseResult = {
  transactions: TransactionRow[]; // แถวละเอียดทั้งหมด
  metrics: PlatformMetrics; // สรุปสำหรับแสดงผล
  warnings: string[]; // คำเตือน (เช่น คอลัมน์หาย, คอลัมน์ใหม่)
};

const toNumber = (value: unknown): number => {
  // ถ้าเป็น number อยู่แล้ว
  if (typeof value === "number") return value;

  // ถ้าเป็น null/undefined
  if (value === null || value === undefined) return 0;

  // แปลงเป็น string แล้วทำความสะอาด
  let str = String(value).trim();

  // ลบ comma, space, currency symbols (฿, $, etc.)
  str = str.replace(/[,\s฿$€£¥]/g, "");

  // ลบ quotes ถ้ามี
  str = str.replace(/["']/g, "");

  // แปลงเป็นตัวเลข
  const n = Number(str);

  // ถ้าแปลงไม่ได้ ให้ return 0
  return Number.isFinite(n) ? n : 0;
};

const normalizeDate = (value: unknown): string | null => {
  // Avoid UTC conversion; keep the local calendar day from Excel data
  const formatLocalDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  if (value instanceof Date && !isNaN(value.getTime())) {
    return formatLocalDate(value);
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return formatLocalDate(d);
  }
  return null;
};

const getString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

// ============================================
// Main Parser
// ============================================
export function parseExcelToTransactions(
  platform: "TikTok" | "Shopee" | "Lazada",
  buffer: Buffer
): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

  // ✅ Trim ชื่อคอลัมน์ทั้งหมด เพื่อป้องกันช่องว่างซ่อน
  const rows = rawRows.map((row) => {
    const cleanRow: Record<string, unknown> = {};
    Object.keys(row).forEach((key) => {
      cleanRow[key.trim()] = row[key];
    });
    return cleanRow;
  });

  switch (platform) {
    case "Shopee":
      return parseShopee(rows);
    case "Lazada":
      return parseLazada(rows);
    case "TikTok":
    default:
      return parseTikTok(rows);
  }
}

// ============================================
// Shopee Parser
// ============================================
function parseShopee(rows: Record<string, unknown>[]): ParseResult {
  const warnings: string[] = [];
  const transactions: TransactionRow[] = [];

  // คอลัมน์ที่จำเป็น
  const orderIdCol = "หมายเลขคำสั่งซื้อ";
  const skuCol = "SKU ร้านค้า";
  const dateCol = "วันที่ทำการสั่งซื้อ";
  const paymentDateCol = "\u0e27\u0e31\u0e19\u0e17\u0e35\u0e48\u0e42\u0e2d\u0e19\u0e0a\u0e33\u0e23\u0e30\u0e40\u0e07\u0e34\u0e19\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08"; // ???????????????????????

  // คอลัมน์การเงิน
  const salesCols = ["สินค้าราคาปกติ", "ส่วนลดสินค้าจากผู้ขาย", "จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"];
  const discountCols = ["ส่วนลดสินค้าที่ออกโดย Shopee", "โค้ดส่วนลดที่ออกโดยผู้ขาย", "Coins Cashback ที่สนับสนุนโดยผู้ขาย"];
  const shippingCols = ["ค่าจัดส่งที่ชำระโดยผู้ซื้อ", "ค่าจัดส่งสินค้าที่ออกโดย Shopee", "ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ", "ค่าจัดส่งสินค้าคืน", "โปรแกรมประหยัดค่าจัดส่งคืนสินค้า", "ค่าจัดส่งสินค้าคืนผู้ขาย"];
  const feeCols = ["ค่าคอมมิชชั่น AMS", "ค่าคอมมิชชั่น", "ค่าบริการ", "ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม", "ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง", "ค่าธุรกรรมการชำระเงิน"];
  const vasCols = ["ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ", "ค่าบริการติดตั้งจริงจากผู้ให้บริการ", "โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย"];

  // ตรวจสอบคอลัมน์ที่จำเป็น
  if (rows.length > 0) {
    const sampleRow = rows[0];
    if (!(orderIdCol in sampleRow)) warnings.push(`⚠️ ไม่พบคอลัมน์ "${orderIdCol}"`);
    if (!(dateCol in sampleRow)) warnings.push(`⚠️ ไม่พบคอลัมน์ "${dateCol}"`);
  }

  // Aggregate data for metrics
  const perDayMap = new Map<string, { revenue: number; fees: number; adjustments: number }>();
  const breakdown: Record<string, number> = {};
  let totalRevenue = 0;
  let totalFees = 0;
  let totalAdjustments = 0;

  const shippingDetail = { buyerPaid: 0, byShopee: 0, shopeeNamed: 0, returnShipping: 0, shippingProgram: 0, sellerReturn: 0 };
  const feeDetail = { commissionAms: 0, commission: 0, service: 0, infra: 0, shippingProgramFee: 0, payment: 0 };
  const vasDetail = { installBuyer: 0, installActual: 0, tradeInBonus: 0 };
  const revenueDetail = { productSales: 0, sellerDiscounts: 0, customerRefund: 0, platformDiscount: 0, sellerCodeDiscount: 0, sellerCoins: 0 };

  rows.forEach((row, index) => {
    const orderId = getString(row[orderIdCol]);
    const sku = getString(row[skuCol]);
    const orderDate = normalizeDate(row[dateCol]);
    const paymentDate = normalizeDate(row[paymentDateCol]);

    if (!orderId) {
      warnings.push(`⚠️ แถวที่ ${index + 2}: ไม่มี Order ID (ข้าม)`);
      return;
    }

    // คำนวณ revenue
    const sale = salesCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const discount = discountCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const revenue = sale + discount;

    // คำนวณ fees
    const shipping = shippingCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const fee = feeCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const vas = vasCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const fees = shipping + fee + vas;

    const adjustments = 0; // Shopee ไม่มี adjustment
    const settlement = revenue + fees + adjustments;

    // เก็บแถวละเอียด
    transactions.push({
      platform: "Shopee",
      external_id: orderId,
      sku: sku || "",
      type: "",
      order_date: orderDate,
      payment_date: paymentDate,
      revenue,
      fees,
      adjustments,
      settlement,
      raw_data: row
    });

    // รวมยอดสำหรับ metrics
    totalRevenue += revenue;
    totalFees += fees;
    totalAdjustments += adjustments;

    // Breakdown details
    revenueDetail.productSales += toNumber(row["สินค้าราคาปกติ"]);
    revenueDetail.sellerDiscounts += toNumber(row["ส่วนลดสินค้าจากผู้ขาย"]);
    revenueDetail.customerRefund += toNumber(row["จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"]);
    revenueDetail.platformDiscount += toNumber(row["ส่วนลดสินค้าที่ออกโดย Shopee"]);
    revenueDetail.sellerCodeDiscount += toNumber(row["โค้ดส่วนลดที่ออกโดยผู้ขาย"]);
    revenueDetail.sellerCoins += toNumber(row["Coins Cashback ที่สนับสนุนโดยผู้ขาย"]);

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

    vasDetail.installBuyer += toNumber(row["ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ"]);
    vasDetail.installActual += toNumber(row["ค่าบริการติดตั้งจริงจากผู้ให้บริการ"]);
    vasDetail.tradeInBonus += toNumber(row["โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย"]);

    // Per day
    if (orderDate) {
      const existing = perDayMap.get(orderDate) ?? { revenue: 0, fees: 0, adjustments: 0 };
      perDayMap.set(orderDate, {
        revenue: existing.revenue + revenue,
        fees: existing.fees + fees,
        adjustments: existing.adjustments + adjustments
      });
    }
  });

  breakdown["ค่าจัดส่งที่ชำระโดยผู้ซื้อ (Shopee)"] = shippingDetail.buyerPaid;
  breakdown["ส่วนลด/ชำระค่าจัดส่งโดย Shopee"] = shippingDetail.byShopee + shippingDetail.shopeeNamed;
  breakdown["ค่าคอมมิชชั่นแพลตฟอร์ม (Shopee)"] = feeDetail.commissionAms + feeDetail.commission;
  breakdown["ค่าธุรกรรมการชำระเงิน (Shopee)"] = feeDetail.payment;

  const perDay = Array.from(perDayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, ...v }));

  const last7 = perDay.slice(-7);

  const metrics: PlatformMetrics = {
    platform: "Shopee",
    revenue: totalRevenue,
    fees: totalFees,
    adjustments: totalAdjustments,
    settlement: totalRevenue + totalFees + totalAdjustments,
    trend: last7.map((d) => d.revenue + d.fees + d.adjustments),
    trendDates: last7.map((d) => d.date),
    perDay,
    breakdown,
    feeGroups: [
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
    ],
    revenueGroups: [
      {
        title: "รายได้ (Shopee)",
        items: [
          {
            label: "ยอดขายสินค้า",
            value: revenueDetail.productSales + revenueDetail.sellerDiscounts + revenueDetail.customerRefund,
            children: [
              { label: "สินค้าราคาปกติ", value: revenueDetail.productSales },
              { label: "ส่วนลดสินค้าจากผู้ขาย", value: revenueDetail.sellerDiscounts },
              { label: "จำนวนเงินที่ทำการคืนให้ผู้ซื้อ", value: revenueDetail.customerRefund }
            ]
          },
          {
            label: "ส่วนลดและโค้ดของผู้ขาย",
            value: revenueDetail.platformDiscount + revenueDetail.sellerCodeDiscount + revenueDetail.sellerCoins,
            children: [
              { label: "ส่วนลดสินค้าที่ออกโดย Shopee", value: revenueDetail.platformDiscount },
              { label: "โค้ดส่วนลดที่ออกโดยผู้ขาย", value: revenueDetail.sellerCodeDiscount },
              { label: "Coins Cashback ที่สนับสนุนโดยผู้ขาย", value: revenueDetail.sellerCoins }
            ]
          }
        ]
      }
    ],
    rows: transactions.length
  };

  return { transactions, metrics, warnings };
}

// ============================================
// TikTok Parser
// ============================================
function parseTikTok(rows: Record<string, unknown>[]): ParseResult {
  const warnings: string[] = [];
  const transactions: TransactionRow[] = [];

  // ตรวจสอบคอลัมน์ที่จำเป็น
  if (rows.length > 0) {
    const columnNames = Object.keys(rows[0]);
    warnings.push(`📋 พบ ${columnNames.length} คอลัมน์ในไฟล์ TikTok`);
  }

  const orderIdCol = "Order/adjustment ID"; // TikTok ใช้ชื่อนี้
  const skuCol = "Seller SKU";
  const dateCol = "Order created time";
  const typeCol = "Statement Type"; // Order/Adjustment

  const revenueCols = ["Subtotal before discounts", "Seller discounts", "Refund subtotal after seller discounts"];
  const feeCols = [
    "Transaction fee", "TikTok Shop commission fee", "Credit card installment - Interest rate cost",
    "Seller shipping fee",
    "Affiliate Commission",
    "Affiliate partner commission", "Affiliate commission deposit", "Affiliate commission refund",
    "Affiliate Shop Ads commission",
    "Affiliate Partner shop ads commission",
    "SFP service fee", "Bonus cashback service fee", "LIVE Specials service fee", "Voucher Xtra service fee",
    "EAMS Program service fee", "Brands Crazy Deals/Flash Sale service fee", "TikTok PayLater program fee",
    "Commerce growth fee", "Infrastructure fee", "Campaign resource fee"
  ];
  const adjustmentCols = ["Ajustment amount"]; // ใช้คอลัมน์นี้สำหรับ adjustments แยกต่างหาก

  if (rows.length > 0) {
    const sampleRow = rows[0];
    if (!(orderIdCol in sampleRow)) warnings.push(`⚠️ ไม่พบคอลัมน์ "${orderIdCol}"`);
    if (!(dateCol in sampleRow)) warnings.push(`⚠️ ไม่พบคอลัมน์ "${dateCol}"`);
  }

  const perDayMap = new Map<string, { revenue: number; fees: number; adjustments: number }>();
  const breakdown: Record<string, number> = {};
  let totalRevenue = 0;
  let totalFees = 0;
  let totalAdjustments = 0;

  const revenueDetail = { subtotalBefore: 0, sellerDiscounts: 0, subtotalAfter: 0, refundSubtotalBefore: 0, refundSellerDiscounts: 0, refundSubtotalAfter: 0 };

  rows.forEach((row, index) => {
    const orderId = getString(row[orderIdCol]);
    const sku = getString(row[skuCol]);
    const orderDate = normalizeDate(row[dateCol]);
    const paymentDate = normalizeDate(row["Order settled time"]);
    const typeRaw = getString(row[typeCol]) || "Order";

    // ✅ เพิ่ม row index เพื่อให้ unique (เพราะ Order เดียวกันอาจมีหลายแถว เช่น Order + Refund)
    const type = `${typeRaw}-ROW${index + 2}`;

    if (!orderId) {
      warnings.push(`⚠️ แถวที่ ${index + 2}: ไม่มี Order ID (ข้าม)`);
      return;
    }

    const revenue = revenueCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const fees = feeCols.reduce((s, c) => {
      const val = toNumber(row[c]);
      breakdown[c] = (breakdown[c] ?? 0) + val;
      return s + val;
    }, 0);
    const adjustments = adjustmentCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const settlement = revenue + fees + adjustments;


    transactions.push({
      platform: "TikTok",
      external_id: orderId,
      sku: sku || "",
      type,
      order_date: orderDate,
      payment_date: paymentDate,
      revenue,
      fees,
      adjustments,
      settlement,
      raw_data: row
    });

    totalRevenue += revenue;
    totalFees += fees;
    totalAdjustments += adjustments;

    revenueDetail.subtotalBefore += toNumber(row["Subtotal before discounts"]);
    revenueDetail.sellerDiscounts += toNumber(row["Seller discounts"]);
    revenueDetail.subtotalAfter += toNumber(row["Subtotal before discounts"]) + toNumber(row["Seller discounts"]);
    revenueDetail.refundSubtotalBefore += toNumber(row["Refund subtotal before seller discounts"]);
    revenueDetail.refundSellerDiscounts += toNumber(row["Refund of seller discounts"]);
    revenueDetail.refundSubtotalAfter += toNumber(row["Refund subtotal before seller discounts"]) + toNumber(row["Refund of seller discounts"]);

    if (orderDate) {
      const existing = perDayMap.get(orderDate) ?? { revenue: 0, fees: 0, adjustments: 0 };
      perDayMap.set(orderDate, {
        revenue: existing.revenue + revenue,
        fees: existing.fees + fees,
        adjustments: existing.adjustments + adjustments
      });
    }
  });

  const perDay = Array.from(perDayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, ...v }));
  const last7 = perDay.slice(-7);

  const metrics: PlatformMetrics = {
    platform: "TikTok",
    revenue: totalRevenue,
    fees: totalFees,
    adjustments: totalAdjustments,
    settlement: totalRevenue + totalFees + totalAdjustments,
    trend: last7.map((d) => d.revenue + d.fees + d.adjustments),
    trendDates: last7.map((d) => d.date),
    perDay,
    breakdown,
    feeGroups: [
      {
        title: "ค่าธรรมเนียม (TikTok)",
        items: Object.entries(breakdown).map(([label, value]) => ({ label, value }))
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
    ],
    rows: transactions.length
  };

  return { transactions, metrics, warnings };
}

// ============================================
// Lazada Parser
// ============================================
function parseLazada(rows: Record<string, unknown>[]): ParseResult {
  const warnings: string[] = [];
  const transactions: TransactionRow[] = [];

  const orderIdCol = "หมายเลขคำสั่งซื้อ";
  const skuCol = "SKU ร้านค้า";
  const dateCol = "วันที่สร้างคำสั่งซื้อ";
  const transactionDateCol = "วันที่ทำรายการ"; // fallback when order date is missing
  const nameCol = "ชื่อรายการธุรกรรม";
  const amountCol = "จำนวนเงิน(รวมภาษี)";

  const revenueKeys = ["ยอดรวมค่าสินค้า", "คืนส่วนลดค่าธรรมเนียมการขายสินค้า"];
  const expenseKeys = ["หักค่าธรรมเนียมการขายสินค้า", "ค่าธรรมเนียมการชำระเงิน", "ส่วนลดค่าขนส่ง จ่ายโดยร้านค้า", "ส่วนต่างค่าจัดส่ง"];

  if (rows.length > 0) {
    const sampleRow = rows[0];
    if (!(orderIdCol in sampleRow)) warnings.push(`⚠️ ไม่พบคอลัมน์ "${orderIdCol}"`);
    if (!(nameCol in sampleRow)) warnings.push(`⚠️ ไม่พบคอลัมน์ "${nameCol}"`);
  }

  const perDayMap = new Map<string, { revenue: number; fees: number; adjustments: number }>();
  const breakdown: Record<string, number> = {};
  const revenueMap = new Map<string, number>();
  let totalRevenue = 0;
  let totalFees = 0;
  let totalAdjustments = 0;

  rows.forEach((row, index) => {
    const orderId = getString(row[orderIdCol]);
    const sku = getString(row[skuCol]);
    const orderDate = normalizeDate(row[dateCol]) ?? normalizeDate(row[transactionDateCol]);
    const name = getString(row[nameCol]);
    const amount = toNumber(row[amountCol]);

    // ✅ สำหรับ Lazada: Order เดียวกันมีหลาย transaction types (ยอดรวมค่าสินค้า, หักค่าธรรมเนียม, etc.)
    // เราต้องทำให้ unique โดยใช้ row index เป็น suffix
    let actualOrderId = orderId;
    let actualType = name;

    if (!orderId) {
      // ใช้ชื่อ transaction + index เป็น ID (เพื่อป้องกันการซ้ำ)
      actualOrderId = `LAZADA-${name.replace(/[^a-zA-Z0-9]/g, "-")}-ROW${index + 2}`;
      warnings.push(`⚠️ แถวที่ ${index + 2}: ไม่มี Order ID (ใช้ synthetic ID: ${actualOrderId})`);
    } else {
      // ✅ ใช้ row index ตรงๆ เพื่อให้ unique (เพราะแต่ละแถวคือ transaction แยกกัน)
      actualType = `${name}-ROW${index + 2}`;
    }

    let revenue = 0;
    let fees = 0;

    if (revenueKeys.includes(name)) {
      revenue = amount;
      revenueMap.set(name, (revenueMap.get(name) ?? 0) + amount);
      breakdown[name] = (breakdown[name] ?? 0) + amount; // ✅ เก็บ revenue ใน breakdown ด้วย
    }
    if (expenseKeys.includes(name)) {
      fees = amount;
      breakdown[name] = (breakdown[name] ?? 0) + amount;
    }

    const adjustments = 0;
    const settlement = revenue + fees + adjustments;

    transactions.push({
      platform: "Lazada",
      external_id: actualOrderId,
      sku: sku || "",
      type: actualType, // ใช้ actualType ที่มี row index
      order_date: orderDate,
      payment_date: orderDate,
      revenue,
      fees,
      adjustments,
      settlement,
      raw_data: row
    });

    totalRevenue += revenue;
    totalFees += fees;
    totalAdjustments += adjustments;

    if (orderDate) {
      const existing = perDayMap.get(orderDate) ?? { revenue: 0, fees: 0, adjustments: 0 };
      perDayMap.set(orderDate, {
        revenue: existing.revenue + revenue,
        fees: existing.fees + fees,
        adjustments: existing.adjustments + adjustments
      });
    }
  });

  const perDay = Array.from(perDayMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, v]) => ({ date, ...v }));
  const last7 = perDay.slice(-7);

  const metrics: PlatformMetrics = {
    platform: "Lazada",
    revenue: totalRevenue,
    fees: totalFees,
    adjustments: totalAdjustments,
    settlement: totalRevenue + totalFees + totalAdjustments,
    trend: last7.map((d) => d.revenue + d.fees + d.adjustments),
    trendDates: last7.map((d) => d.date),
    perDay,
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
            value: totalRevenue,
            children: Array.from(revenueMap.entries()).map(([label, value]) => ({ label, value }))
          }
        ]
      }
    ],
    rows: transactions.length
  };

  return { transactions, metrics, warnings };
}

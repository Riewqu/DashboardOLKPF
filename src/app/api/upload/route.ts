import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { parseExcelToTransactions } from "@/lib/transactionParser";
import { aggregateTransactions } from "@/lib/metrics";
import { randomUUID } from "crypto";
import type { TransactionRow } from "@/lib/transactionParser";
import type { Database } from "@/lib/database.types";
import { requireAdmin } from "@/lib/auth/apiHelpers";

const MAX_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_PLATFORMS = ["TikTok", "Shopee", "Lazada"];

type BreakdownGroup = {
  title: string;
  items: { label: string; value: number; children?: { label: string; value: number }[] }[];
};

type TxWithRaw = Pick<TransactionRow, "raw_data"> & Partial<TransactionRow>;

// Helper to parse numeric values from raw_data
const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  let str = String(value).trim();
  str = str.replace(/[,\s฿$€£¥]/g, "");
  str = str.replace(/["']/g, "");
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
};

// Build breakdown / groups by aggregating all transactions in DB (not just the latest file)
function aggregateBreakdown(allTx: TxWithRaw[], platform: "TikTok" | "Shopee" | "Lazada") {
  const breakdown: Record<string, number> = {};
  const children: Record<string, Record<string, number>> = {};

  const addLabel = (label: string, value: unknown) => {
    const n = toNumber(value);
    if (n === 0) return;
    breakdown[label] = (breakdown[label] ?? 0) + n;
  };

  const addChild = (parent: string, child: string, value: unknown) => {
    const n = toNumber(value);
    if (n === 0) return;
    if (!children[parent]) children[parent] = {};
    children[parent][child] = (children[parent][child] ?? 0) + n;
  };

  // Known column labels per platform (matching parsers)
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

  // Child mappings for detailed drilldown
  const childMap: Record<string, Record<string, string[]>> = {
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
    const row = tx.raw_data ?? {};
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

  // If parent label has children, use sum of children as parent value
  Object.entries(children).forEach(([parent, childObj]) => {
    const sum = Object.values(childObj).reduce((acc, v) => acc + v, 0);
    breakdown[parent] = sum;
  });

  const buildGroup = (title: string, labels: string[]) =>
    ({
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

  // Derive parent totals from children
  Object.entries(children).forEach(([parent, childObj]) => {
    const sum = Object.values(childObj).reduce((acc, v) => acc + v, 0);
    breakdown[parent] = sum;
  });

  let feeGroups: BreakdownGroup[] = [];
  let revenueGroups: BreakdownGroup[] = [];

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

export async function POST(req: Request) {
  // 🔒 Admin authentication required
  const auth = await requireAdmin();
  if (!auth.success) return auth.response;

  const uploadId = randomUUID();

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const platform = form.get("platform") as ("TikTok" | "Shopee" | "Lazada") | null;

    if (!file || !platform || !ALLOWED_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: "ต้องมีไฟล์และ platform (TikTok/Shopee/Lazada)" }, { status: 400 });
    }
    const platformValue = platform as "TikTok" | "Shopee" | "Lazada";

    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 15MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload raw file to Supabase storage
    const filePath = `${platformValue}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("uploads")
      .upload(filePath, buffer, { contentType: file.type || "application/octet-stream" });

    if (uploadError) {
      return NextResponse.json({ error: `อัปโหลด storage ไม่สำเร็จ: ${uploadError.message}` }, { status: 500 });
    }

    // 2. Parse Excel to transactions
    const parseResult = parseExcelToTransactions(platformValue, buffer);
    const { transactions, metrics, warnings } = parseResult;
    const numericMetrics = [metrics.revenue, metrics.fees, metrics.adjustments, metrics.settlement];
    if (numericMetrics.some((n) => !Number.isFinite(n))) {
      return NextResponse.json({ error: "Parsed metrics are invalid" }, { status: 400 });
    }

    console.log(`📊 Parsed ${transactions.length} transactions from ${file.name}`);
    console.log(`💰 Summary: Revenue=${metrics.revenue.toFixed(2)}, Fees=${metrics.fees.toFixed(2)}, Adjustments=${metrics.adjustments.toFixed(2)}, Settlement=${metrics.settlement.toFixed(2)}`);
    if (warnings.length > 0) {
      console.warn("⚠️ Warnings:", warnings);
    }

    // 3. Create upload_batches record
    const { error: batchError } = await supabaseAdmin
      .from("upload_batches")
      .insert({
        id: uploadId,
        platform: platformValue,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        total_rows: transactions.length,
        status: "processing",
        revenue: metrics.revenue,
        fees: metrics.fees,
        adjustments: metrics.adjustments,
        settlement: metrics.settlement
      })
      .select()
      .single();

    if (batchError) {
      console.error("❌ Failed to create upload_batches record:", batchError);
      return NextResponse.json({ error: `สร้าง batch record ไม่สำเร็จ: ${batchError.message}` }, { status: 500 });
    }

    // 4. Upsert transactions (with unique constraint)
    let newRows = 0;
    let updatedRows = 0;
    let errorRows = 0;

    // เตรียมข้อมูลสำหรับ upsert
    const transactionsToInsert = transactions.map((t) => ({
      upload_id: uploadId,
      uploaded_at: new Date().toISOString(),
      platform: t.platform,
      external_id: t.external_id,
      sku: t.sku,
      type: t.type,
      order_date: t.order_date,
      payment_date: t.payment_date ?? t.order_date,
      revenue: t.revenue,
      fees: t.fees,
      adjustments: t.adjustments,
      settlement: t.settlement,
      raw_data: t.raw_data
    }));


    // ✅ Deduplicate ภายในไฟล์เดียวก่อน upsert (last value wins)
    const uniqueMap = new Map<string, typeof transactionsToInsert[0]>();
    const duplicateKeys: string[] = [];
    transactionsToInsert.forEach((tx) => {
      const key = `${tx.platform}|${tx.external_id}|${tx.sku}|${tx.type}`;
      if (uniqueMap.has(key)) {
        duplicateKeys.push(key); // เก็บ key ที่ซ้ำ
      }
      uniqueMap.set(key, tx); // ค่าสุดท้ายชนะ
    });
    const deduplicatedTransactions = Array.from(uniqueMap.values());

    const duplicatesRemoved = transactionsToInsert.length - deduplicatedTransactions.length;
    if (duplicatesRemoved > 0) {
      console.log(`🔄 Removed ${duplicatesRemoved} duplicate rows within file (last value wins)`);
      console.log(`📊 Original: ${transactionsToInsert.length} rows, After dedupe: ${deduplicatedTransactions.length} rows`);
      warnings.push(`🔄 ลบแถวซ้ำภายในไฟล์ ${duplicatesRemoved} แถว (ใช้ค่าสุดท้าย)`);
    }

    // ใช้ upsert เพื่อป้องกันข้อมูลซ้ำกับฐานข้อมูล
    type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
    const upsertPayload = deduplicatedTransactions as unknown as TransactionInsert[];

    const { error: upsertError, count } = await supabaseAdmin
      .from("transactions")
      .upsert(upsertPayload, {
        onConflict: "platform,external_id,sku,type",
        count: "exact"
      })
      .select();

    if (upsertError) {
      console.error("❌ Failed to upsert transactions:", upsertError);
      errorRows = deduplicatedTransactions.length;

      // Update batch status to failed
      await supabaseAdmin
        .from("upload_batches")
        .update({
          status: "failed",
          error_rows: errorRows,
          error_message: upsertError.message,
          completed_at: new Date().toISOString()
        })
        .eq("id", uploadId);

      return NextResponse.json({
        error: `บันทึก transactions ไม่สำเร็จ: ${upsertError.message}`,
        warnings
      }, { status: 500 });
    }

    // คำนวณ new vs updated rows
    // (Supabase ไม่ return ว่าเป็น insert หรือ update, เราจะประมาณจาก count)
    newRows = count || 0;
    updatedRows = deduplicatedTransactions.length - newRows;

    console.log(`✅ Upserted ${count} rows (estimated: ${newRows} new, ${updatedRows} updated)`);

    // 5. Update batch statistics
    await supabaseAdmin
      .from("upload_batches")
      .update({
        status: "completed",
        new_rows: newRows,
        updated_rows: updatedRows,
        completed_at: new Date().toISOString()
      })
      .eq("id", uploadId);

    // 6. Recalculate platform_metrics from all transactions
    await recalculatePlatformMetrics(platformValue);

    return NextResponse.json({
      ok: true,
      uploadId,
      platform: platformValue,
      filePath,
      summary: {
        totalRows: transactions.length,
        newRows,
        updatedRows,
        errorRows,
        revenue: metrics.revenue,
        fees: metrics.fees,
        adjustments: metrics.adjustments,
        settlement: metrics.settlement
      },
      warnings,
      notice: `อัปโหลดสำเร็จ! ${newRows} แถวใหม่, ${updatedRows} แถวอัปเดต`
    });

  } catch (err) {
    console.error("❌ Upload error:", err);

    // Update batch status to failed
    if (uploadId) {
      await supabaseAdmin
        ?.from("upload_batches")
        .update({
          status: "failed",
          error_message: String(err),
          completed_at: new Date().toISOString()
        })
        .eq("id", uploadId);
    }

    return NextResponse.json({
      error: "เกิดข้อผิดพลาดในการอัปโหลด",
      details: String(err)
    }, { status: 500 });
  }
}

// ============================================
// Helper: Recalculate platform_metrics
// ============================================
async function recalculatePlatformMetrics(platform: "TikTok" | "Shopee" | "Lazada") {
  if (!supabaseAdmin) return;

  try {
    // Fetch in batches (Supabase REST caps at 1k rows per request)
    const pageSize = 1000;
    let offset = 0;
    let fetchedRows = 0;

    // Get total count via HEAD (not limited by row cap)
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from("transactions")
      .select("*", { head: true, count: "exact" })
      .eq("platform", platform);
    if (countError) {
      console.error("Failed to count transactions for metrics:", countError);
    }

    const allTx: TransactionRow[] = [];

    while (true) {
      const { data: txData, error: txError } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("platform", platform)
        .order("order_date", { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (txError || !txData) {
        console.error("Failed to fetch transactions for metrics:", txError);
        break;
      }

      if (txData.length === 0) break;

      allTx.push(...(txData as TransactionRow[]));
      fetchedRows += txData.length;
      offset += pageSize;

      if (txData.length < pageSize) {
        break;
      }
    }

    const aggregated = aggregateTransactions(allTx, "order_date");
    const aggregatedPaid = aggregateTransactions(allTx, "payment_date", "order_date");
    const aggregatedBreakdown = aggregateBreakdown(allTx, platform);
    const effectiveCount = Math.max(totalCount ?? 0, fetchedRows);
    if (totalCount && fetchedRows < totalCount) {
      console.warn(`Count mismatch while recalculating metrics for ${platform}: expected ${totalCount}, fetched ${fetchedRows}`);
    }

    console.log(`dY"S Recalculating metrics for ${platform}: ${effectiveCount} transactions found in DB`);
    console.log(`dY'? Calculated totals for ${platform}: Revenue=${aggregated.totalRevenue.toFixed(2)}, Fees=${aggregated.totalFees.toFixed(2)}, Adjustments=${aggregated.totalAdjustments.toFixed(2)}, Settlement=${(aggregated.totalRevenue + aggregated.totalFees + aggregated.totalAdjustments).toFixed(2)}`);

    const { error: metricsError } = await supabaseAdmin
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
        breakdown: aggregatedBreakdown.breakdown,
        fee_groups: aggregatedBreakdown.feeGroups,
        revenue_groups: aggregatedBreakdown.revenueGroups,
        total_transactions: effectiveCount,
        total_transactions_paid: aggregatedPaid.totalTransactions,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "platform"
      });

    if (metricsError) {
      console.error("Failed to update platform_metrics:", metricsError);
    } else {
      console.log(`Updated platform_metrics for ${platform}`);
    }

  } catch (err) {
    console.error("Error in recalculatePlatformMetrics:", err);
  }
}

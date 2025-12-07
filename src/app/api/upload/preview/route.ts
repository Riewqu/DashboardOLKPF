import { NextResponse } from "next/server";
import { parseExcelToTransactions } from "@/lib/transactionParser";

const MAX_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_PLATFORMS = ["TikTok", "Shopee", "Lazada"];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const platform = form.get("platform") as string | null;

    if (!file || !platform || !ALLOWED_PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: "ต้องมีไฟล์และ platform (TikTok/Shopee/Lazada)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 15MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel to transactions (preview only - don't save)
    const parseResult = parseExcelToTransactions(platform as "TikTok" | "Shopee" | "Lazada", buffer);
    const { transactions, metrics, warnings } = parseResult;

    console.log(`📊 Preview: Parsed ${transactions.length} transactions from ${file.name}`);
    console.log(`💰 Summary: Revenue=${metrics.revenue.toFixed(2)}, Fees=${metrics.fees.toFixed(2)}, Adjustments=${metrics.adjustments.toFixed(2)}, Settlement=${metrics.settlement.toFixed(2)}`);

    return NextResponse.json({
      ok: true,
      preview: true,
      summary: {
        totalRows: transactions.length,
        revenue: metrics.revenue,
        fees: metrics.fees,
        adjustments: metrics.adjustments,
        settlement: metrics.settlement
      },
      warnings
    });

  } catch (err) {
    console.error("❌ Preview error:", err);
    return NextResponse.json({
      error: "เกิดข้อผิดพลาดในการอ่านไฟล์",
      details: String(err)
    }, { status: 500 });
  }
}

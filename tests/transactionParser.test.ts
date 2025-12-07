import * as XLSX from "xlsx";
import { parseExcelToTransactions } from "@/lib/transactionParser";

const buildBuffer = (rows: Record<string, unknown>[]) => {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

describe("parseExcelToTransactions", () => {
  it("parses TikTok sheet and normalizes numbers/dates", () => {
    const buffer = buildBuffer([
      {
        "Order/adjustment ID": "TK-123",
        "Seller SKU": "SKU-1",
        "Order created time": "2024-01-02",
        "Statement Type": "Order",
        "Subtotal before discounts": "1,000",
        "Seller discounts": "-100",
        "Refund subtotal after seller discounts": "0",
        "Transaction fee": "-10",
        "Ajustment amount": "0"
      }
    ]);

    const result = parseExcelToTransactions("TikTok", buffer);

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].order_date).toBe("2024-01-02");
    expect(result.metrics.revenue).toBeCloseTo(900);
    expect(result.metrics.fees).toBeCloseTo(-10);
    expect(result.metrics.settlement).toBeCloseTo(890);
  });
});

import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export type ShopeeSummary = {
  revenue: number;
  fees: number;
  adjustments: number;
  settlement: number;
  trend: number[];
  trendDates: string[];
  rows: number;
  breakdown: {
    shippingBuyer: number;
    shippingShopee: number;
    commission: number;
    paymentFee: number;
    other: number;
  };
  feeDetails: {
    shipping: {
      buyerPaid: number;
      byShopee: number;
      shopeeNamed: number;
      returnShipping: number;
      shippingProgram: number;
      sellerReturn: number;
    };
    fee: {
      commissionAms: number;
      commission: number;
      service: number;
      infra: number;
      shippingProgramFee: number;
      payment: number;
    };
    vas: {
      installBuyer: number;
      installActual: number;
      tradeInBonus: number;
    };
  };
  perDay: { date: string; revenue: number; fees: number; adjustments: number }[];
  feeGroups?: { title: string; items: { label: string; value: number }[] }[];
  revenueGroups?: { title: string; items: { label: string; value: number; children?: { label: string; value: number }[] }[] }[];
};

const number = (value: unknown): number => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeDate = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && value.trim()) return new Date(value).toISOString().slice(0, 10);
  return undefined;
};

export function loadShopeeFromExcel(): ShopeeSummary | null {
  try {
    const filePath = path.join(process.cwd(), "data", "Shopee.xlsx");
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: 0 });

    const salesCols = ["สินค้าราคาปกติ", "ส่วนลดสินค้าจากผู้ขาย", "จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"];
    const discountCols = [
      "ส่วนลดสินค้าที่ออกโดย Shopee",
      "โค้ดส่วนลดที่ออกโดยผู้ขาย",
      "Coins Cashback ที่สนับสนุนโดยผู้ขาย"
    ];
    const shippingCols = [
      "ค่าจัดส่งที่ชำระโดยผู้ซื้อ",
      "ค่าจัดส่งสินค้าที่ออกโดย Shopee",
      "ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ",
      "ค่าจัดส่งสินค้าคืน",
      "โปรแกรมประหยัดค่าจัดส่งคืนสินค้า",
      "ค่าจัดส่งสินค้าคืนผู้ขาย"
    ];
    const feeCols = [
      "ค่าคอมมิชชั่น AMS",
      "ค่าคอมมิชชั่น",
      "ค่าบริการ",
      "ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม",
      "ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง",
      "ค่าธุรกรรมการชำระเงิน"
    ];
    const vasCols = [
      "ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ",
      "ค่าบริการติดตั้งจริงจากผู้ให้บริการ",
      "โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย"
    ];
    const dateCol = "วันที่ทำการสั่งซื้อ";

    let revenue = 0;
    let fees = 0;
    const adjustments = 0;
    const perDay = new Map<string, number>();

    let shippingBuyer = 0;
    let shippingShopee = 0;
    let commission = 0;
    let paymentFee = 0;
  let otherFees = 0;
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

    const perDayMap = new Map<string, { revenue: number; fees: number; adjustments: number }>();

    for (const row of rows) {
      const sale = salesCols.reduce((sum, key) => sum + number(row[key]), 0);
      const discount = discountCols.reduce((sum, key) => sum + number(row[key]), 0);
      const revenueLine = sale + discount;

      const shipping = shippingCols.reduce((sum, key) => sum + number(row[key]), 0);
      const fee = feeCols.reduce((sum, key) => sum + number(row[key]), 0);
      const vas = vasCols.reduce((sum, key) => sum + number(row[key]), 0);
      const expenseLine = shipping + fee + vas;

      revenue += revenueLine;
      fees += expenseLine;

      productSales += number(row["สินค้าราคาปกติ"]);
      sellerDiscounts += number(row["ส่วนลดสินค้าจากผู้ขาย"]);
      customerRefund += number(row["จำนวนเงินที่ทำการคืนให้ผู้ซื้อ"]);
      platformDiscount += number(row["ส่วนลดสินค้าที่ออกโดย Shopee"]);
      sellerCodeDiscount += number(row["โค้ดส่วนลดที่ออกโดยผู้ขาย"]);
      sellerCoins += number(row["Coins Cashback ที่สนับสนุนโดยผู้ขาย"]);

      shippingBuyer += number(row["ค่าจัดส่งที่ชำระโดยผู้ซื้อ"]);
      shippingDetail.buyerPaid += number(row["ค่าจัดส่งที่ชำระโดยผู้ซื้อ"]);

      shippingShopee += number(row["ค่าจัดส่งสินค้าที่ออกโดย Shopee"]);
      shippingDetail.byShopee += number(row["ค่าจัดส่งสินค้าที่ออกโดย Shopee"]);

      shippingShopee += number(row["ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ"]);
      shippingDetail.shopeeNamed += number(row["ค่าจัดส่งที่ Shopee ชำระโดยชื่อของคุณ"]);

      shippingDetail.returnShipping += number(row["ค่าจัดส่งสินค้าคืน"]);
      shippingDetail.sellerReturn += number(row["ค่าจัดส่งสินค้าคืนผู้ขาย"]);
      shippingDetail.shippingProgram += number(row["โปรแกรมประหยัดค่าจัดส่งคืนสินค้า"]);

      commission += number(row["ค่าคอมมิชชั่น AMS"]) + number(row["ค่าคอมมิชชั่น"]);
      feeDetail.commissionAms += number(row["ค่าคอมมิชชั่น AMS"]);
      feeDetail.commission += number(row["ค่าคอมมิชชั่น"]);

      paymentFee += number(row["ค่าธุรกรรมการชำระเงิน"]);
      feeDetail.payment += number(row["ค่าธุรกรรมการชำระเงิน"]);

      feeDetail.service += number(row["ค่าบริการ"]);
      feeDetail.infra += number(row["ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม"]);
      feeDetail.shippingProgramFee += number(row["ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง"]);

      otherFees +=
        number(row["ค่าธรรมเนียม ของโปรแกรมประหยัดค่าจัดส่ง"]) +
        number(row["ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม"]) +
        number(row["ค่าบริการ"]);

      vasDetail.installBuyer += number(row["ค่าบริการติดตั้งที่ชำระโดยผู้ซื้อ"]);
      vasDetail.installActual += number(row["ค่าบริการติดตั้งจริงจากผู้ให้บริการ"]);
      vasDetail.tradeInBonus += number(row["โบนัสส่วนลดเครื่องเก่าแลกใหม่จากผู้ขาย"]);

      const date = normalizeDate(row[dateCol]);
      if (date) {
        perDay.set(date, (perDay.get(date) ?? 0) + (revenueLine + expenseLine));
        const existing = perDayMap.get(date) ?? { revenue: 0, fees: 0, adjustments: 0 };
        perDayMap.set(date, {
          revenue: existing.revenue + revenueLine,
          fees: existing.fees + expenseLine,
          adjustments: existing.adjustments
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
      trend: last7.map(([, v]) => Number(v)),
      breakdown: {
        shippingBuyer,
        shippingShopee,
        commission,
        paymentFee,
        other: otherFees
      },
      feeDetails: {
        shipping: shippingDetail,
        fee: feeDetail,
        vas: vasDetail
      },
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
      perDay: Array.from(perDayMap.entries()).map(([date, values]) => ({
        date,
        revenue: values.revenue,
        fees: values.fees,
        adjustments: values.adjustments
      })),
      revenueGroups: [
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
      ]
    };
  } catch (err) {
    console.error("loadShopeeFromExcel error:", err);
    return null;
  }
}

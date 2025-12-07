"use client";

import { useMemo, useState } from "react";
import { Trophy, MapPin, ChevronLeft, ChevronRight, BarChart3, Eye, X, Package } from "lucide-react";

type ProvinceProduct = {
  sku: string;
  name: string;
  qty: number;
  revenue: number;
  image_url?: string | null;
};

type ProvinceSales = {
  name: string;
  totalQty: number;
  totalRevenue: number;
  productCount: number;
  products: ProvinceProduct[];
};

type Props = {
  topProvinces: ProvinceSales[];
  provinces: ProvinceSales[];
  search: string;
  provinceFilter: string;
  sortBy: "revenue" | "qty" | "product";
};

export function ThailandProvinceTables({ topProvinces, provinces, search, provinceFilter, sortBy }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProvince, setModalProvince] = useState<ProvinceSales | null>(null);
  const [modalPage, setModalPage] = useState(1);
  const modalPageSize = 10;

  const filteredProvinces = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return provinces
      .filter((p) => {
        const matchProvince = provinceFilter === "all" || p.name === provinceFilter;
        const matchKeyword =
          !keyword ||
          p.name.toLowerCase().includes(keyword) ||
          p.products.some((prod) => prod.name.toLowerCase().includes(keyword));
        return matchProvince && matchKeyword;
      })
      .sort((a, b) => {
        if (sortBy === "revenue") return b.totalRevenue - a.totalRevenue;
        if (sortBy === "qty") return b.totalQty - a.totalQty;
        return b.productCount - a.productCount;
      });
  }, [provinces, provinceFilter, search, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filteredProvinces.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginated = filteredProvinces.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Modal pagination
  const modalProducts = modalProvince?.products || [];
  const modalPageCount = Math.max(1, Math.ceil(modalProducts.length / modalPageSize));
  const modalCurrentPage = Math.min(modalPage, modalPageCount);
  const modalPaginated = modalProducts.slice((modalCurrentPage - 1) * modalPageSize, modalCurrentPage * modalPageSize);

  const openModal = (province: ProvinceSales) => {
    setModalProvince(province);
    setModalPage(1);
    setModalOpen(true);
    // Prevent background scroll and ensure fullscreen
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalProvince(null);
    // Restore normal scrolling
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Top 5 */}
        <div className="xl:col-span-1">
          <div className="h-full rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden transition-colors" style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)"
          }}>
            <div className="px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-blue-100/70 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200 mb-1">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">Top 5</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white">จังหวัดยอดขายสูงสุด</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">เรียงตามยอดขายปัจจุบัน</p>
                </div>
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-100 text-xs font-semibold flex-shrink-0">
                  {topProvinces.length}
                </div>
              </div>
            </div>
            <div className="divide-y divide-blue-50 dark:divide-slate-800">
              {topProvinces.map((province, idx) => {
                const maxRevenue = topProvinces[0]?.totalRevenue || 1;
                const percent = Math.max(8, Math.min(100, (province.totalRevenue / maxRevenue) * 100));
                return (
                  <div
                    key={province.name}
                    className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-blue-50/70 dark:hover:bg-[#101a2b] transition-colors"
                  >
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold flex items-center justify-center shadow-md text-sm sm:text-base">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-900 dark:text-white font-semibold truncate text-sm sm:text-base">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 dark:text-blue-300 flex-shrink-0" />
                        {province.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {province.productCount.toLocaleString()} รายการ • {province.totalQty.toLocaleString()} ชิ้น
                      </div>
                      <div className="h-1.5 sm:h-2 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-600 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap flex-shrink-0">
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        ฿{province.totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">ยอดขาย</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Province Table */}
        <div className="xl:col-span-2">
          <div className="rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden transition-colors" style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)"
          }}>
            <div className="px-6 sm:px-8 pt-6 pb-3 flex items-center justify-between border-b border-blue-100/70 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-200">
                <BarChart3 className="w-5 h-5" />
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Overview</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">รายละเอียดทุกจังหวัด</h3>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/60 dark:text-blue-100 text-xs font-semibold">
                {filteredProvinces.length} จังหวัด
              </div>
            </div>

            <div className="overflow-x-auto">
              {/* Mobile cards */}
              <div className="grid gap-3 md:hidden">
                {paginated.map((province) => {
                  const percent = Math.min(100, Math.max(8, (province.totalRevenue / (topProvinces[0]?.totalRevenue || 1)) * 100));
                  return (
                    <div key={province.name} className="rounded-2xl border backdrop-blur-xl p-4 shadow-sm space-y-3" style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)"
                    }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                            <MapPin className="w-4 h-4 text-blue-500 dark:text-blue-300" />
                            {province.name}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {province.productCount.toLocaleString()} รายการ • {province.totalQty.toLocaleString()} ชิ้น
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-600 dark:text-slate-300">ยอดขาย</div>
                          <div className="text-base font-bold text-slate-900 dark:text-white">
                            ฿{province.totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-300 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                        <div className="rounded-lg border border-blue-100 dark:border-slate-800 bg-blue-50/70 dark:bg-slate-800/70 px-3 py-2">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">จำนวนชิ้น</div>
                          <div className="font-semibold">{province.totalQty.toLocaleString()} ชิ้น</div>
                        </div>
                        <div className="rounded-lg border border-blue-100 dark:border-slate-800 bg-blue-50/70 dark:bg-slate-800/70 px-3 py-2">
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">รายการสินค้า</div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold">{province.productCount.toLocaleString()} รายการ</div>
                            <button
                              onClick={() => openModal(province)}
                              className="p-1 rounded hover:bg-blue-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-300 transition-colors"
                              title="ดูทั้งหมด"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      {province.products.length > 0 && (
                        <div className="space-y-1.5">
                          {province.products.slice(0, 3).map((product) => (
                            <div key={product.sku} className="flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200">
                              <span className="truncate">{product.name}</span>
                              <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{product.qty} ชิ้น</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <table className="hidden md:table min-w-full text-sm text-slate-900 dark:text-slate-100">
                <thead className="bg-gradient-to-r from-blue-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 text-left uppercase tracking-wide text-xs text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 font-semibold">จังหวัด</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">ยอดขาย</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">จำนวนชิ้น</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">รายการสินค้า</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Top สินค้า</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50 dark:divide-slate-800">
                  {paginated.map((province) => {
                    const percent = Math.min(100, Math.max(8, (province.totalRevenue / (topProvinces[0]?.totalRevenue || 1)) * 100));
                    return (
                      <tr key={province.name} className="hover:bg-blue-50/60 dark:hover:bg-slate-800/70 transition-colors">
                        <td className="px-4 sm:px-6 py-4 align-top">
                          <div className="flex items-start gap-2">
                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-300" aria-hidden="true" />
                            <div>
                              <div className="font-semibold">{province.name}</div>
                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                {province.productCount.toLocaleString()} รายการ • {province.totalQty.toLocaleString()} ชิ้น
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap">
                          <div className="text-base font-bold">
                            ฿{province.totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden max-w-[200px]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-300 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap text-slate-700 dark:text-slate-200">
                          {province.totalQty.toLocaleString()} ชิ้น
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top whitespace-nowrap text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>{province.productCount.toLocaleString()} รายการ</span>
                            <button
                              onClick={() => openModal(province)}
                              className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-300 transition-colors"
                              title="ดูรายการสินค้าทั้งหมด"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 align-top">
                          <div className="space-y-1.5 max-w-xs">
                            {province.products.slice(0, 3).map((product) => (
                              <div key={product.sku} className="flex items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200">
                                <span className="truncate">{product.name}</span>
                                <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">{product.qty} ชิ้น</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        ไม่พบข้อมูลตามตัวกรอง
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-blue-100/70 dark:border-slate-800 bg-gradient-to-r from-blue-50/40 via-white to-cyan-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                หน้า {currentPage} / {pageCount} • ทั้งหมด {filteredProvinces.length} จังหวัด
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 disabled:opacity-40 hover:bg-blue-50/70 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage === pageCount}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-200 disabled:opacity-40 hover:bg-blue-50/70 dark:hover:bg-slate-800 transition-colors"
                >
                  ถัดไป <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product List Modal - เต็มจอบนมือถือ */}
      {modalOpen && modalProvince && (
        <div
          className="fixed inset-0 z-[9999] md:flex md:items-center md:justify-center md:p-4"
          onClick={closeModal}
          style={{ margin: 0, padding: 0 }}
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal Container - Full screen on mobile, centered card on desktop */}
          <div
            className="relative w-screen h-screen md:w-auto md:h-auto md:max-h-[90vh] md:max-w-3xl bg-white dark:bg-slate-900 md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ margin: 0, padding: 0 }}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-500 dark:from-blue-900 dark:via-cyan-900 dark:to-indigo-900 px-4 py-4 md:px-6 md:py-8">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />

              <div className="relative flex items-start justify-between gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <div className="p-2 md:p-3 bg-white/20 backdrop-blur-xl rounded-lg md:rounded-xl">
                      <Package className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] md:text-xs uppercase tracking-widest text-white/80 font-semibold">รายการสินค้าทั้งหมด</div>
                      <div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1">
                        <MapPin className="w-3 h-3 md:w-4 md:h-4 text-white/90 flex-shrink-0" />
                        <h2 className="text-base md:text-2xl font-bold text-white truncate">{modalProvince.name}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-3 text-xs md:text-sm text-white/90">
                    <div className="flex items-center gap-1 md:gap-1.5 bg-white/20 backdrop-blur-xl px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                      <span className="font-semibold">{modalProvince.productCount.toLocaleString()}</span>
                      <span>รายการ</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5 bg-white/20 backdrop-blur-xl px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                      <span className="font-semibold">{modalProvince.totalQty.toLocaleString()}</span>
                      <span>ชิ้น</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-1.5 bg-white/20 backdrop-blur-xl px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                      <span className="font-semibold">฿{modalProvince.totalRevenue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={closeModal}
                  className="flex-shrink-0 p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white transition-all hover:rotate-90 duration-300"
                  aria-label="ปิด"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Product List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-3 py-3 md:px-6 md:py-4 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
              <div className="space-y-2">
                {modalPaginated.map((product, idx) => {
                  const globalIdx = (modalCurrentPage - 1) * modalPageSize + idx + 1;
                  return (
                    <div
                      key={product.sku}
                      className="group relative bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                    >
                      {/* Number badge */}
                      <div className="absolute -top-2 -left-2 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-bold shadow-lg">
                        {globalIdx}
                      </div>

                      <div className="flex flex-col md:flex-row items-start gap-2 md:gap-4 ml-4 md:ml-4">
                        {/* Product Image */}
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 md:w-16 md:h-16 object-contain flex-shrink-0 self-start"
                            style={{
                              background: "transparent",
                              border: "none",
                              boxShadow: "none",
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-slate-500 flex-shrink-0 self-start">
                            <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0 w-full">
                          <div className="font-semibold text-sm md:text-base text-slate-900 dark:text-white mb-0.5 md:mb-1 break-words">
                            {product.name}
                          </div>
                          <div className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-mono">
                            SKU: {product.sku}
                          </div>
                        </div>

                        <div className="flex md:flex-col items-center md:items-end gap-2 md:gap-1 flex-shrink-0 self-end md:self-start w-full md:w-auto justify-between md:justify-start">
                          <div className="flex items-center gap-1.5 md:gap-2 px-2 py-1 md:px-3 md:py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            <Package className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            <span className="font-bold text-xs md:text-sm">{product.qty.toLocaleString()}</span>
                            <span className="text-[10px] md:text-xs">ชิ้น</span>
                          </div>
                          <div className="text-[10px] md:text-xs font-semibold text-slate-600 dark:text-slate-300">
                            ฿{product.revenue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {modalProducts.length === 0 && (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>ไม่มีข้อมูลสินค้า</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Pagination */}
            {modalProducts.length > modalPageSize && (
              <div className="border-t border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-3 md:px-6 md:py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-300 text-center md:text-left">
                    หน้า <span className="font-bold text-slate-900 dark:text-white">{modalCurrentPage}</span> / {modalPageCount}
                    <span className="ml-1 md:ml-2 text-slate-500 dark:text-slate-400">
                      (แสดง {modalPaginated.length} จาก {modalProducts.length} รายการ)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModalPage(p => Math.max(1, p - 1))}
                      disabled={modalCurrentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-xs md:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">ก่อนหน้า</span>
                    </button>

                    <button
                      onClick={() => setModalPage(p => Math.min(modalPageCount, p + 1))}
                      disabled={modalCurrentPage === modalPageCount}
                      className="inline-flex items-center gap-1 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-xs md:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-slate-700 transition-all hover:scale-105 active:scale-95"
                    >
                      <span className="hidden sm:inline">ถัดไป</span>
                      <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

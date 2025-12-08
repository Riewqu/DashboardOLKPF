"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { loadThailandGeoJSON, type ThailandGeoJSON } from "@/lib/thailandGeoData";
import { PROVINCE_ENGLISH_TO_THAI, getEnglishName, getThaiName } from "@/lib/provinceNameMap";
import { MapPin, TrendingUp, Package, DollarSign, Search, X } from "lucide-react";

type ProvinceData = {
  name: string;
  totalRevenue: number;
  totalQty: number;
  productCount: number;
};

type ThailandMapProps = {
  provinces: ProvinceData[];
  annotations?: {
    name: string;
    value?: number;
    qty?: number;
    rank?: number;
  }[];
  compact?: boolean;
};

const normalizeKey = (value: string): string => {
  return value
    .replace(/จังหวัด|\bจ\.\s*/gi, "")
    .replace(/province|\bprov\./gi, "")
    .replace(/[.\s-]/g, "")
    .toLowerCase()
    .trim();
};

const normalizeProvinceName = (name: string, lookup: Map<string, string>): string => {
  const trimmed = name.trim();
  const key = normalizeKey(trimmed);
  const mapped = lookup.get(key);
  if (mapped) return mapped;

  const englishFromThai = getEnglishName(trimmed);
  if (englishFromThai) {
    return getThaiName(englishFromThai);
  }
  const thaiFromEnglish = getThaiName(trimmed);
  return thaiFromEnglish || trimmed;
};

export function ThailandMapD3({ provinces, annotations = [], compact = false }: ThailandMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null);
  const [geoData, setGeoData] = useState<ThailandGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedProvince, setHighlightedProvince] = useState<string | null>(null);

  const provinceLookup = useMemo(() => {
    const lookupMap = new Map<string, string>();
    Object.entries(PROVINCE_ENGLISH_TO_THAI).forEach(([english, thai]) => {
      lookupMap.set(normalizeKey(english), thai);
      lookupMap.set(normalizeKey(thai), thai);
    });
    return lookupMap;
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    loadThailandGeoJSON().then((data) => {
      setGeoData(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      setContainerWidth(containerRef.current?.clientWidth || 0);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const updateTheme = () => {
      const isDocDark = document.documentElement.classList.contains("dark");
      const isBodyDark = document.body.classList.contains("dark-mode") || document.body.classList.contains("dark");
      setIsDark(isDocDark || isBodyDark);
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("theme-changed", updateTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener("theme-changed", updateTheme);
    };
  }, []);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim() || !geoData) {
      setHighlightedProvince(null);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const foundProvince = provinces.find(p =>
      p.name.toLowerCase().includes(query)
    );

    if (foundProvince) {
      setHighlightedProvince(foundProvince.name);
    } else {
      setHighlightedProvince(null);
    }
  }, [searchQuery, provinces, geoData]);

  // Render map
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !geoData || loading) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll("*").remove();

    // Get container dimensions
    const width = Math.max(containerWidth || container.clientWidth, 320);
    const isMobileView = width < 768;

    // Thailand is a vertically tall country, needs more height especially on mobile
    // Mobile: use 1.6x ratio for better vertical display
    // Desktop: use 1.2x ratio
    const heightRatio = isMobileView ? 1.6 : 1.2;
    const height = isMobileView
      ? Math.max(440, width * heightRatio)  // Mobile: minimum 440px, prefer 1.6x width
      : Math.min(720, Math.max(480, width * heightRatio)); // Desktop: max 720px

    // Set SVG dimensions + viewBox for responsive scaling
    svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

    // Create projection for Thailand
    // Thailand spans approximately: Longitude 97°-106°E, Latitude 5°-21°N
    // Mobile: shift map downward by using fitExtent with positive top offset
    const projection = isMobileView
      ? d3.geoMercator().fitExtent([[0, 40], [width, height - 40]], geoData as unknown as d3.GeoPermissibleObjects)
      : d3.geoMercator().fitSize([width, height], geoData as unknown as d3.GeoPermissibleObjects);

    const path = d3.geoPath().projection(projection);

    // Create province data map for quick lookup (English name → Thai name → data)
    const provinceDataMap = new Map<string, ProvinceData>();
    provinces.forEach((p) => {
      const normalizedName = normalizeProvinceName(p.name, provinceLookup);
      provinceDataMap.set(normalizedName, { ...p, name: normalizedName });
    });

    const revenueProvinces = provinces.filter((p) => p.totalRevenue > 0);
    const avgRevenue = revenueProvinces.length > 0
      ? revenueProvinces.reduce((sum, p) => sum + p.totalRevenue, 0) / revenueProvinces.length
      : 0;

    // Debug: Log all GeoJSON province names
    console.log("📍 GeoJSON province names:", geoData.features.map(f => f.properties.name));

    // Professional color scale with clear thresholds (Blue-focused gradient)
    const maxRevenue = Math.max(...provinces.map((p) => p.totalRevenue), 1);

    // Define color thresholds (ปรับให้เหมาะกับยอดขายส่วนใหญ่ไม่เกิน 100K)
    const colorThresholds = [
      { max: 0, color: "#e0e7ff", label: "ไม่มีข้อมูล" }, // indigo-100 (light blue-ish)
      { max: 10000, color: "#bfdbfe", label: "0-10K" }, // blue-200
      { max: 30000, color: "#93c5fd", label: "10K-30K" }, // blue-300
      { max: 50000, color: "#60a5fa", label: "30K-50K" }, // blue-400
      { max: 100000, color: "#3b82f6", label: "50K-100K" }, // blue-500
      { max: Infinity, color: "#1e40af", label: "100K+" } // blue-800
    ];

    const getColorByRevenue = (revenue: number): string => {
      if (revenue === 0) return colorThresholds[0].color;
      for (const threshold of colorThresholds) {
        if (revenue <= threshold.max) return threshold.color;
      }
      return colorThresholds[colorThresholds.length - 1].color;
    };

    // Create gradient for background (theme-aware)
    const defs = svg.append("defs");

    const bgGradient = defs
      .append("linearGradient")
      .attr("id", "bg-gradient-map")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    bgGradient.append("stop").attr("offset", "0%").attr("stop-color", isDark ? "#0f172a" : "#f0f9ff");

    bgGradient.append("stop").attr("offset", "100%").attr("stop-color", isDark ? "#1f2937" : "#e0f2fe");

    // Background
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#bg-gradient-map)")
      .attr("rx", 24);

    // Create tooltip
    const tooltip = d3
      .select(container)
      .append("div")
      .attr(
        "class",
        "absolute hidden backdrop-blur-xl rounded-2xl shadow-2xl p-4 pointer-events-none z-50 transition-all duration-200"
      )
      .style("max-width", "300px")
      .style("background", isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)")
      .style("color", isDark ? "#e2e8f0" : "#0f172a")
      .style("border", isDark ? "1px solid rgba(148,163,184,0.6)" : "1px solid rgba(191,219,254,0.6)");

    const positionTooltip = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const tooltipEl = tooltip.node() as HTMLDivElement | null;
      const tipWidth = tooltipEl?.offsetWidth || 240;
      const tipHeight = tooltipEl?.offsetHeight || 140;

      let x = event.clientX - rect.left + 16;
      let y = event.clientY - rect.top - tipHeight - 16;

      // If not enough space above, show below cursor
      if (y < 8) {
        y = event.clientY - rect.top + 16;
      }

      // Clamp within container bounds
      x = Math.min(Math.max(8, x), rect.width - tipWidth - 8);
      y = Math.min(Math.max(8, y), rect.height - tipHeight - 8);

      tooltip.style("left", `${x}px`).style("top", `${y}px`);
    };

    // Draw provinces with enhanced shadows and depth
    let hoverTimeout: NodeJS.Timeout | null = null;

    const provinceGroups = svg
      .selectAll("path.province")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("d", (d) => path(d as d3.GeoPermissibleObjects))
      .attr("fill", (d) => {
        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        const data = provinceDataMap.get(thaiName);

        if (data) {
          return getColorByRevenue(data.totalRevenue);
        }
        // Light indigo for provinces without data (เข้ากับโทนน้ำเงิน)
        return "#e0e7ff";
      })
      .attr("stroke", (d) => {
        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        return thaiName === highlightedProvince ? "#f59e0b" : "#ffffff";
      })
      .attr("stroke-width", (d) => {
        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        return thaiName === highlightedProvince ? "4" : "1.5";
      })
      .attr("opacity", (d) => {
        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        return thaiName === highlightedProvince ? 1 : 0.95;
      })
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .style("pointer-events", "all")
      .style("filter", (d) => {
        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        const data = provinceDataMap.get(thaiName);

        // Highlighted province gets special glow
        if (thaiName === highlightedProvince) {
          return "drop-shadow(0px 0px 20px rgba(245, 158, 11, 0.9)) drop-shadow(0px 0px 30px rgba(245, 158, 11, 0.6)) drop-shadow(2px 2px 8px rgba(217, 119, 6, 0.7))";
        }

        if (data && data.totalRevenue > 0) {
          // Enhanced shadow based on revenue - higher revenue = stronger shadow
          const intensity = Math.min(data.totalRevenue / maxRevenue, 1);
          const shadowStrength = 2 + (intensity * 6); // 2-8px blur
          const shadowOffset = 1 + (intensity * 3); // 1-4px offset
          const shadowOpacity = 0.15 + (intensity * 0.25); // 0.15-0.4 opacity

          return `drop-shadow(${shadowOffset}px ${shadowOffset}px ${shadowStrength}px rgba(37, 99, 235, ${shadowOpacity})) drop-shadow(0px 0px ${intensity * 3}px rgba(37, 99, 235, ${intensity * 0.2}))`;
        }
        return "drop-shadow(1px 1px 2px rgba(148, 163, 184, 0.2))";
      })
      .on("mouseover", function (event, d) {
        // Clear any pending timeout to prevent flickering
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }

        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        const data = provinceDataMap.get(thaiName);
        const growthVsAvg = data && avgRevenue > 0 ? ((data.totalRevenue - avgRevenue) / avgRevenue) * 100 : 0;

        const element = d3.select(this);

        // Apply hover effects with slight delay for smooth transition
        element
          .attr("opacity", 1)
          .attr("stroke-width", "3")
          .attr("stroke", "#3b82f6")
          .style("filter", () => {
            // Enhanced glow effect on hover
            return "drop-shadow(0px 0px 16px rgba(59, 130, 246, 0.9)) drop-shadow(0px 0px 24px rgba(59, 130, 246, 0.5)) drop-shadow(2px 2px 8px rgba(37, 99, 235, 0.6))";
          });

        // Show enhanced tooltip with stats
        tooltip
          .classed("hidden", false)
          .html(
            `
            <div class="space-y-3">
              <div class="flex items-center gap-2 pb-2 border-b ${isDark ? "border-slate-700" : "border-blue-200"}">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="font-bold ${isDark ? "text-slate-100" : "text-gray-900"}">${thaiName}</div>
              </div>
              ${
                data
                  ? `
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="${isDark ? "bg-slate-800 text-slate-200" : "bg-blue-50 text-gray-600"} rounded-lg p-2">
                    <div class="text-xs ${isDark ? "text-slate-400" : "text-gray-600"}">ยอดขาย</div>
                    <div class="font-bold ${isDark ? "text-blue-300" : "text-blue-600"}">฿${data.totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div class="${isDark ? "bg-slate-800 text-slate-200" : "bg-cyan-50 text-gray-600"} rounded-lg p-2">
                    <div class="text-xs ${isDark ? "text-slate-400" : "text-gray-600"}">จำนวน</div>
                    <div class="font-bold ${isDark ? "text-cyan-300" : "text-cyan-600"}">${data.totalQty.toLocaleString()} ชิ้น</div>
                  </div>
                </div>

                ${maxRevenue > 0 ? `
                  <div class="${isDark ? "bg-slate-800" : "bg-slate-50"} rounded-lg p-2">
                    <div class="flex items-center justify-between text-xs mb-1">
                      <span class="${isDark ? "text-slate-400" : "text-gray-600"}">เทียบกับอันดับ 1</span>
                      <span class="font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}">${((data.totalRevenue / maxRevenue) * 100).toFixed(0)}%</span>
                    </div>
                    <div class="h-2 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"} overflow-hidden">
                      <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style="width: ${((data.totalRevenue / maxRevenue) * 100).toFixed(1)}%"></div>
                    </div>
                  </div>
                ` : ''}

                ${avgRevenue > 0 && Math.abs(growthVsAvg) > 0.1 ? `
                  <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg ${growthVsAvg > 0 ? (isDark ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-50 text-emerald-700") : (isDark ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700")}">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      ${growthVsAvg > 0
                        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>'
                        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>'
                      }
                    </svg>
                    <span class="text-xs font-semibold">${growthVsAvg > 0 ? '+' : ''}${growthVsAvg.toFixed(1)}% vs ค่าเฉลี่ย</span>
                  </div>
                ` : ''}
              `
                  : `
                <div class="text-sm ${isDark ? "text-slate-400" : "text-gray-500"} text-center py-2">
                  ยังไม่มียอดขายในจังหวัดนี้
                </div>
              `
              }
            </div>
          `
          );

        positionTooltip(event as MouseEvent);
      })
      .on("mousemove", function (event) {
        positionTooltip(event as MouseEvent);
      })
      .on("mouseout", function (event, d) {
        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        const data = provinceDataMap.get(thaiName);

        const element = d3.select(this);

        // Clear any pending timeout first
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }

        // Immediately restore the original state
        element
          .attr("opacity", 0.95)
          .attr("stroke-width", "1.5")
          .attr("stroke", "#ffffff");

        // Apply filter after a tiny delay to ensure it takes effect
        setTimeout(() => {
          element.style("filter", () => {
            // Restore original shadow
            if (data && data.totalRevenue > 0) {
              const intensity = Math.min(data.totalRevenue / maxRevenue, 1);
              const shadowStrength = 2 + (intensity * 6);
              const shadowOffset = 1 + (intensity * 3);
              const shadowOpacity = 0.15 + (intensity * 0.25);
              return `drop-shadow(${shadowOffset}px ${shadowOffset}px ${shadowStrength}px rgba(37, 99, 235, ${shadowOpacity})) drop-shadow(0px 0px ${intensity * 3}px rgba(37, 99, 235, ${intensity * 0.2}))`;
            }
            return "drop-shadow(1px 1px 2px rgba(148, 163, 184, 0.2))";
          });
        }, 10);

        tooltip.classed("hidden", true);
      })
      .on("click", function (event, d) {
        const englishName = d.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        const data = provinceDataMap.get(thaiName);

        if (data) {
          tooltip
            .classed("hidden", false)
            .html(
              `
            <div class="space-y-2">
              <div class="flex items-center gap-2 pb-2 border-b ${isDark ? "border-slate-700" : "border-blue-200"}">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="font-bold ${isDark ? "text-slate-100" : "text-gray-900"}">${thaiName}</div>
              </div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="${isDark ? "bg-slate-800 text-slate-200" : "bg-blue-50 text-gray-600"} rounded-lg p-2">
                  <div class="text-xs ${isDark ? "text-slate-400" : "text-gray-600"}">ยอดขาย</div>
                  <div class="font-bold ${isDark ? "text-blue-300" : "text-blue-600"}">฿${data.totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>
                </div>
                <div class="${isDark ? "bg-slate-800 text-slate-200" : "bg-cyan-50 text-gray-600"} rounded-lg p-2">
                  <div class="text-xs ${isDark ? "text-slate-400" : "text-gray-600"}">จำนวน</div>
                  <div class="font-bold ${isDark ? "text-cyan-300" : "text-cyan-600"}">${data.totalQty.toLocaleString()} ชิ้น</div>
                </div>
                <div class="${isDark ? "bg-slate-800 text-slate-200" : "bg-indigo-50 text-gray-600"} rounded-lg p-2 col-span-2">
                  <div class="text-xs ${isDark ? "text-slate-400" : "text-gray-600"}">รายการสินค้า</div>
                  <div class="font-bold ${isDark ? "text-indigo-300" : "text-indigo-600"}">${data.productCount} รายการ</div>
                </div>
              </div>
            </div>
          `
            );
          positionTooltip(event as MouseEvent);
          const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
          if (isDesktop) {
            setSelectedProvince(data);
            // Scroll to details (desktop only)
            setTimeout(() => {
              document.getElementById("province-details")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 100);
          }
        }
      });

    // --- Annotation Callouts (Top provinces) ---
    svg.selectAll(".callouts").remove();
    if (annotations && annotations.length > 0) {
      const calloutLayer = svg.append("g").attr("class", "callouts");
      const safeMargin = 16;
      const labelWidth = 180;
      const labelHeight = 48;

      const slotCount = annotations.length + 1;
      annotations.forEach((ann, idx) => {
        const feature = geoData.features.find((f) => {
          const englishName = f.properties.name;
          const thaiName = normalizeProvinceName(englishName, provinceLookup);
          return thaiName === ann.name;
        });
        if (!feature) return;

        const [cx, cy] = path.centroid(feature as d3.GeoPermissibleObjects);
        const toLeft = cx > width / 2;
        const labelX = toLeft ? safeMargin : width - safeMargin;
        const slotY = safeMargin + ((idx + 1) * (height - 2 * safeMargin)) / slotCount;
        const labelY = Math.min(height - safeMargin - labelHeight / 2, Math.max(safeMargin + labelHeight / 2, slotY));

        const elbowX = cx + (toLeft ? -24 : 24);
        const elbowY = (cy + labelY) / 2;
        const endX = toLeft ? labelX + labelWidth : labelX - labelWidth;

        const color = `hsl(${200 + idx * 20}, 75%, ${isDark ? 60 : 50}%)`;

        // line
        calloutLayer
          .append("path")
          .attr("d", `M ${cx} ${cy} L ${elbowX} ${elbowY} L ${endX} ${labelY}`)
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("fill", "none")
          .attr("stroke-linecap", "round")
          .attr("stroke-linejoin", "round")
          .attr("opacity", 0.9);

        // dot
        calloutLayer
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy)
          .attr("r", 4.5)
          .attr("fill", color)
          .attr("stroke", isDark ? "#0f172a" : "#fff")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.95);

        // label group
        const labelGroup = calloutLayer
          .append("g")
          .attr("transform", `translate(${toLeft ? labelX : labelX - labelWidth}, ${labelY - labelHeight / 2})`);

        labelGroup
          .append("rect")
          .attr("width", labelWidth)
          .attr("height", labelHeight)
          .attr("rx", 12)
          .attr("fill", isDark ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.94)")
          .attr("stroke", isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)")
          .attr("filter", isDark ? "drop-shadow(0px 6px 14px rgba(0,0,0,0.35))" : "drop-shadow(0px 6px 14px rgba(59,130,246,0.2))");

        const text = labelGroup
          .append("text")
          .attr("x", 12)
          .attr("y", 18)
          .attr("fill", isDark ? "#e2e8f0" : "#0f172a")
          .attr("font-size", 12)
          .attr("font-weight", 700);

        text.append("tspan").text(`${ann.rank ? `#${ann.rank} ` : ""}${ann.name}`);
        const sub = labelGroup
          .append("text")
          .attr("x", 12)
          .attr("y", 34)
          .attr("fill", isDark ? "#94a3b8" : "#475569")
          .attr("font-size", 11)
          .attr("font-weight", 600);
        sub.append("tspan").text(`${ann.qty ? ann.qty.toLocaleString("th-TH") : 0} ชิ้น`);
        if (ann.value !== undefined) {
          sub.append("tspan").text(` · ฿${ann.value.toLocaleString("th-TH", { maximumFractionDigits: 0 })}`);
        }
      });
    }

    // Add fade-in animation on load
    provinceGroups
      .attr("opacity", 0)
      .transition()
      .duration(600)
      .delay((d, i) => i * 5)
      .attr("opacity", 0.95);

    // Auto-show tooltip for highlighted province
    if (highlightedProvince) {
      const feature = geoData.features.find(f => {
        const englishName = f.properties.name;
        const thaiName = normalizeProvinceName(englishName, provinceLookup);
        return thaiName === highlightedProvince;
      });

      if (feature) {
        const centroid = path.centroid(feature as d3.GeoPermissibleObjects);
        const data = provinceDataMap.get(highlightedProvince);

        if (data) {
          tooltip
            .classed("hidden", false)
            .html(
              `
              <div class="space-y-3">
                <div class="flex items-center gap-2 pb-2 border-b ${isDark ? "border-slate-700" : "border-blue-200"}">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="font-bold ${isDark ? "text-slate-100" : "text-gray-900"}">${highlightedProvince}</div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div class="${isDark ? "bg-slate-800 text-slate-200" : "bg-blue-50 text-gray-600"} rounded-lg p-2">
                    <div class="text-xs ${isDark ? "text-slate-400" : "text-gray-600"}">ยอดขาย</div>
                    <div class="font-bold ${isDark ? "text-blue-300" : "text-blue-600"}">฿${data.totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</div>
                  </div>
                  <div class="${isDark ? "bg-slate-800 text-slate-200" : "bg-cyan-50 text-gray-600"} rounded-lg p-2">
                    <div class="text-xs ${isDark ? "text-slate-400" : "text-gray-600"}">จำนวน</div>
                    <div class="font-bold ${isDark ? "text-cyan-300" : "text-cyan-600"}">${data.totalQty.toLocaleString()} ชิ้น</div>
                  </div>
                </div>
                ${maxRevenue > 0 ? `
                  <div class="${isDark ? "bg-slate-800" : "bg-slate-50"} rounded-lg p-2">
                    <div class="flex items-center justify-between text-xs mb-1">
                      <span class="${isDark ? "text-slate-400" : "text-gray-600"}">เทียบกับอันดับ 1</span>
                      <span class="font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}">${((data.totalRevenue / maxRevenue) * 100).toFixed(0)}%</span>
                    </div>
                    <div class="h-2 rounded-full ${isDark ? "bg-slate-700" : "bg-gray-200"} overflow-hidden">
                      <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style="width: ${((data.totalRevenue / maxRevenue) * 100).toFixed(1)}%"></div>
                    </div>
                  </div>
                ` : ''}
              </div>
            `
            )
            .style("left", `${centroid[0]}px`)
            .style("top", `${centroid[1] - 100}px`);
        }
      }
    }

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [provinces, geoData, loading, containerWidth, isDark, highlightedProvince, provinceLookup, annotations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">กำลังโหลดแผนที่...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Map Container */}
      <div className="relative backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden transition-colors" style={{
        background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.5)",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 1)",
        boxShadow: isDark ? "0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)" : "0 10px 35px rgba(0, 0, 0, 0.1)"
      }}>
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>

        <div className="relative p-6 sm:p-8">
          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${compact ? "mb-1" : "mb-6"}`}>
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                แผนที่ประเทศไทย
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">แสดงการกระจายยอดขาย 77 จังหวัด</p>
            </div>

            {/* Search Box - Hidden in compact mode */}
            {!compact && (
              <>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาจังหวัด..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-blue-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="hidden lg:flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span>มียอดขาย</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <span>ยังไม่มี</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search result indicator - Hidden in compact mode */}
          {!compact && searchQuery && highlightedProvince && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">พบจังหวัด: <strong>{highlightedProvince}</strong></span>
              </div>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-800/50 text-amber-700 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              >
                ล้างการค้นหา
              </button>
            </div>
          )}

          {!compact && searchQuery && !highlightedProvince && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
              <p className="text-sm flex items-center gap-2">
                <X className="w-4 h-4" />
                {`ไม่พบจังหวัด "${searchQuery}"`}
              </p>
            </div>
          )}

          <div
            ref={containerRef}
            className={`relative ${compact ? "min-h-[220px]" : "min-h-[420px] sm:min-h-[520px]"} ${compact ? "overflow-hidden" : "overflow-x-auto"}`}
          >
            <div className={`${compact ? "w-full" : "min-w-[360px] w-full"}`}>
              <svg ref={svgRef} className="w-full" preserveAspectRatio="xMidYMid meet"></svg>
            </div>
          </div>

          {/* Legend intentionally removed on Dashboard view */}
        </div>
      </div>

      {/* Selected Province Details */}
      {selectedProvince && (
        <div className="hidden md:block">
          <div
            id="province-details"
            className="relative overflow-hidden backdrop-blur-xl border rounded-3xl shadow-2xl animate-in slide-in-from-top duration-500 text-slate-900 dark:text-slate-100"
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.05)" : "linear-gradient(to bottom right, rgba(224, 242, 254, 0.7), rgba(255, 255, 255, 0.7))",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(191, 219, 254, 0.5)",
              boxShadow: isDark ? "0 20px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)" : "0 10px 35px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>

            <div className="relative p-6 sm:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{selectedProvince.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">รายละเอียดจังหวัด</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProvince(null)}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="backdrop-blur-xl rounded-2xl p-6 shadow-lg border" style={{
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.5)"
                }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/60 rounded-xl">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300">ยอดขายรวม</div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    ฿{selectedProvince.totalRevenue.toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="backdrop-blur-xl rounded-2xl p-6 shadow-lg border" style={{
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.5)"
                }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/60 rounded-xl">
                      <Package className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300">จำนวนสินค้า</div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                    {selectedProvince.totalQty.toLocaleString()} <span className="text-lg">ชิ้น</span>
                  </div>
                </div>

                <div className="backdrop-blur-xl rounded-2xl p-6 shadow-lg border" style={{
                  background: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.5)"
                }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300">รายการสินค้า</div>
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {selectedProvince.productCount} <span className="text-lg">รายการ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

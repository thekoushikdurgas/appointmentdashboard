/**
 * Chart theme — Dashboard UI kit series colors aligned with c360 design tokens.
 * Series: [primary, accent, success, warning] — matches dashboard-1.js ActivityBar palette.
 */
export const CHART_COLORS = {
  primary: "#2f4cdd",
  accent: "#b519ec",
  success: "#2bc155",
  warning: "#ff6d4d",
  info: "#2781d5",
  danger: "#f72b50",
};

/** `rgba(r,g,b,a)` from a `#rrggbb` hex (for SVG / canvas fills tied to theme). */
export function rgbaFromHex(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const CHART_SERIES = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.info,
];

export const CHART_GRID_COLOR = "#f0f1f5";
export const CHART_TOOLTIP_BG = "rgba(255, 255, 255, 0.98)";
export const CHART_TOOLTIP_SHADOW = "0 4px 20px rgba(82, 63, 105, 0.15)";

export const RECHARTS_DEFAULTS = {
  margin: { top: 5, right: 10, bottom: 5, left: 0 },
  cartesianGridProps: {
    strokeDasharray: "4 4",
    stroke: CHART_GRID_COLOR,
    vertical: false,
  },
  axisProps: {
    tick: { fill: "#adadad", fontSize: 12, fontFamily: "Poppins, sans-serif" },
    axisLine: false,
    tickLine: false,
  },
  tooltipContentStyle: {
    background: CHART_TOOLTIP_BG,
    border: `1px solid ${CHART_GRID_COLOR}`,
    borderRadius: 10,
    boxShadow: CHART_TOOLTIP_SHADOW,
    fontFamily: "Poppins, sans-serif",
    fontSize: 13,
  },
};

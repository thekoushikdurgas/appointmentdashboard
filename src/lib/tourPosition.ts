export type TourPlacement = "top" | "bottom" | "left" | "right";

export const TOUR_TOOLTIP_WIDTH = 320;
/** Matches measured tooltip height (~170–190px) with padding for clamp math. */
export const TOUR_TOOLTIP_HEIGHT_ESTIMATE = 200;
export const TOUR_VIEWPORT_PADDING = 16;
export const TOUR_ANCHOR_GAP = 12;
const MAX_ANCHOR_HEIGHT_FRAC = 0.42;
const MAX_ANCHOR_HEIGHT_PX = 280;
const SMALL_ANCHOR_MAX_HEIGHT = 72;
const TOUR_PANEL_SELECTORS = ".c360-hs-drawer, .c360-saved-searches-panel";

/** Left edge of a fixed right-hand panel when the anchor lives inside one. */
export function panelLeftEdge(el: Element | null): number | null {
  if (!el || typeof el.closest !== "function") return null;
  const panel = el.closest(TOUR_PANEL_SELECTORS);
  if (!panel) return null;
  return panel.getBoundingClientRect().left;
}
export interface TooltipPos {
  top: number;
  left: number;
  placement: TourPlacement;
  /** Full target bounds for the spotlight ring. */
  highlightRect?: DOMRect;
  /** Condensed bounds used for placement math and arrows. */
  anchorRect?: DOMRect;
  arrowOffset?: number;
}

export interface PositionViewport {
  width: number;
  height: number;
}

export interface TooltipSize {
  width: number;
  height: number;
}

function clampAxis(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function clampTooltipToViewport(
  top: number,
  left: number,
  tooltipSize: TooltipSize,
  viewport: PositionViewport,
  pad = TOUR_VIEWPORT_PADDING,
): { top: number; left: number } {
  const { width: TW, height: TH } = tooltipSize;
  return {
    top: clampAxis(top, pad, viewport.height - TH - pad),
    left: clampAxis(left, pad, viewport.width - TW - pad),
  };
}

/** Tall panels (filter column, drawers) — position against a readable top band, not full height. */
export function condenseAnchorRect(
  rect: DOMRect,
  viewport: PositionViewport,
): DOMRect {
  const maxH = Math.min(
    viewport.height * MAX_ANCHOR_HEIGHT_FRAC,
    MAX_ANCHOR_HEIGHT_PX,
  );
  if (rect.height <= maxH) return rect;
  const top = rect.top;
  const left = rect.left;
  const width = rect.width;
  const height = maxH;
  return {
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function horizontalForPlacement(
  rect: DOMRect,
  placement: TourPlacement,
  tooltipSize: TooltipSize,
  viewport: PositionViewport,
  pad: number,
): number {
  const { width: TW } = tooltipSize;
  const gap = TOUR_ANCHOR_GAP;

  if (placement === "bottom" || placement === "top") {
    const wideContent = rect.width > viewport.width * 0.55;
    const centered = rect.left + rect.width / 2 - TW / 2;
    const aligned = wideContent ? rect.left : centered;
    return clampAxis(aligned, pad, viewport.width - TW - pad);
  }
  if (placement === "left") return rect.left - TW - gap;
  if (placement === "right") return rect.right + gap;
  return rect.left;
}

function verticalForPlacement(
  rect: DOMRect,
  placement: TourPlacement,
  tooltipSize: TooltipSize,
): number {
  const { height: TH } = tooltipSize;
  const gap = TOUR_ANCHOR_GAP;
  const short = rect.height <= 96;

  if (placement === "left" || placement === "right") {
    if (short) return rect.top;
    return rect.top + rect.height / 2 - TH / 2;
  }
  if (placement === "bottom") return rect.bottom + gap;
  return rect.top - TH - gap;
}

function overlapsAnchor(
  top: number,
  left: number,
  tooltipSize: TooltipSize,
  rect: DOMRect,
  gap = TOUR_ANCHOR_GAP,
): boolean {
  const { width: TW, height: TH } = tooltipSize;
  return !(
    left + TW <= rect.left - gap ||
    left >= rect.right + gap ||
    top + TH <= rect.top - gap ||
    top >= rect.bottom + gap
  );
}

function arrowOffsetForPlacement(
  placement: TourPlacement,
  top: number,
  left: number,
  tooltipSize: TooltipSize,
  rect: DOMRect,
): number {
  const { width: TW, height: TH } = tooltipSize;
  const pad = 28;
  if (placement === "bottom" || placement === "top") {
    const anchorCenterX = rect.left + rect.width / 2;
    return clampAxis(anchorCenterX - left, pad, TW - pad);
  }
  const anchorCenterY = rect.top + rect.height / 2;
  return clampAxis(anchorCenterY - top, pad, TH - pad);
}

function buildPlacement(
  rect: DOMRect,
  placement: TourPlacement,
  tooltipSize: TooltipSize,
  viewport: PositionViewport,
  panelLeft: number | null = null,
): TooltipPos {
  const { width: TW } = tooltipSize;
  const gap = TOUR_ANCHOR_GAP;
  const pad = TOUR_VIEWPORT_PADDING;

  let left = horizontalForPlacement(
    rect,
    placement,
    tooltipSize,
    viewport,
    pad,
  );
  let top = verticalForPlacement(rect, placement, tooltipSize);

  let clamped = clampTooltipToViewport(top, left, tooltipSize, viewport, pad);
  top = clamped.top;
  left = clamped.left;

  if (placement === "left") {
    const clearEdge = panelLeft ?? rect.left;
    if (left + TW > clearEdge - gap) {
      left = Math.max(pad, clearEdge - TW - gap);
      clamped = clampTooltipToViewport(top, left, tooltipSize, viewport, pad);
      top = clamped.top;
      left = clamped.left;
    }
  }

  if (placement === "right" && left < rect.right + gap) {
    left = rect.right + gap;
    clamped = clampTooltipToViewport(top, left, tooltipSize, viewport, pad);
    top = clamped.top;
    left = clamped.left;
  }

  return {
    top,
    left,
    placement,
    anchorRect: rect,
    arrowOffset: arrowOffsetForPlacement(
      placement,
      top,
      left,
      tooltipSize,
      rect,
    ),
  };
}

function withHighlight(
  pos: TooltipPos,
  rawRect: DOMRect,
  condensed: DOMRect,
): TooltipPos {
  return { ...pos, highlightRect: rawRect, anchorRect: condensed };
}

function clearsPanelLeft(
  pos: TooltipPos,
  tooltipSize: TooltipSize,
  panelLeft: number | null,
  gap = TOUR_ANCHOR_GAP,
): boolean {
  if (panelLeft == null || pos.placement !== "left") return true;
  return pos.left + tooltipSize.width <= panelLeft - gap;
}

function placementFits(
  pos: TooltipPos,
  tooltipSize: TooltipSize,
  viewport: PositionViewport,
  rect: DOMRect,
  pad = TOUR_VIEWPORT_PADDING,
  panelLeft: number | null = null,
): boolean {
  const { width: TW, height: TH } = tooltipSize;
  return (
    pos.top >= pad &&
    pos.left >= pad &&
    pos.top + TH <= viewport.height - pad &&
    pos.left + TW <= viewport.width - pad &&
    !overlapsAnchor(pos.top, pos.left, tooltipSize, rect) &&
    clearsPanelLeft(pos, tooltipSize, panelLeft)
  );
}

export function computeTourPosition(
  el: Element | null,
  preferred: TourPlacement = "bottom",
  viewport: PositionViewport = {
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  },
  tooltipSize: TooltipSize = {
    width: TOUR_TOOLTIP_WIDTH,
    height: TOUR_TOOLTIP_HEIGHT_ESTIMATE,
  },
): TooltipPos {
  const pad = TOUR_VIEWPORT_PADDING;
  const { width: TW, height: TH } = tooltipSize;

  if (!el) {
    const centered = clampTooltipToViewport(
      viewport.height / 2 - TH / 2,
      viewport.width / 2 - TW / 2,
      tooltipSize,
      viewport,
      pad,
    );
    return { ...centered, placement: "bottom" };
  }

  const rawRect = el.getBoundingClientRect();
  if (rawRect.width <= 0 || rawRect.height <= 0) {
    const centered = clampTooltipToViewport(
      viewport.height / 2 - TH / 2,
      viewport.width / 2 - TW / 2,
      tooltipSize,
      viewport,
      pad,
    );
    return { ...centered, placement: preferred, anchorRect: rawRect };
  }

  const rect = condenseAnchorRect(rawRect, viewport);
  const panelLeft = panelLeftEdge(el);

  const order: TourPlacement[] = [preferred];
  const fallbacks: TourPlacement[] = ["right", "left", "bottom", "top"];
  for (const p of fallbacks) {
    if (!order.includes(p)) order.push(p);
  }

  // Footer sidebar icons only — not full-height filter columns or drawers.
  if (
    rect.height <= SMALL_ANCHOR_MAX_HEIGHT &&
    rect.bottom > viewport.height * 0.72 &&
    preferred === "right"
  ) {
    const idx = order.indexOf("top");
    if (idx > 0) {
      order.splice(idx, 1);
      order.unshift("top");
    } else if (!order.includes("top")) {
      order.unshift("top");
    }
  }

  for (const placement of order) {
    const candidate = buildPlacement(
      rect,
      placement,
      tooltipSize,
      viewport,
      panelLeft,
    );
    if (placementFits(candidate, tooltipSize, viewport, rect, pad, panelLeft)) {
      return withHighlight(candidate, rawRect, rect);
    }
  }

  return withHighlight(
    buildPlacement(rect, preferred, tooltipSize, viewport, panelLeft),
    rawRect,
    rect,
  );
}

/// <reference types="vitest/globals" />
import {
  clampTooltipToViewport,
  computeTourPosition,
  condenseAnchorRect,
  TOUR_TOOLTIP_HEIGHT_ESTIMATE,
  TOUR_TOOLTIP_WIDTH,
  TOUR_VIEWPORT_PADDING,
} from "./tourPosition";

const viewport = { width: 1463, height: 873 };

function mockRect(partial: {
  top: number;
  left: number;
  width: number;
  height: number;
}): Element {
  return {
    getBoundingClientRect: () =>
      ({
        top: partial.top,
        left: partial.left,
        width: partial.width,
        height: partial.height,
        bottom: partial.top + partial.height,
        right: partial.left + partial.width,
        x: partial.left,
        y: partial.top,
        toJSON: () => ({}),
      }) as DOMRect,
  } as Element;
}

describe("clampTooltipToViewport", () => {
  it("keeps billing tooltip inside viewport when anchor is near footer", () => {
    const tipH = 171;
    const anchorTop = 775.25;
    const rawTop = anchorTop;
    const { top } = clampTooltipToViewport(
      rawTop,
      246,
      { width: TOUR_TOOLTIP_WIDTH, height: tipH },
      viewport,
    );
    expect(top + tipH).toBeLessThanOrEqual(
      viewport.height - TOUR_VIEWPORT_PADDING,
    );
    expect(top).toBeLessThan(anchorTop);
  });
});

describe("computeTourPosition", () => {
  it("centers welcome step in viewport", () => {
    const pos = computeTourPosition(null, "bottom", viewport);
    expect(pos.top).toBeCloseTo(
      viewport.height / 2 - TOUR_TOOLTIP_HEIGHT_ESTIMATE / 2,
      0,
    );
    expect(pos.left).toBeCloseTo(
      viewport.width / 2 - TOUR_TOOLTIP_WIDTH / 2,
      0,
    );
    expect(pos.anchorRect).toBeUndefined();
  });

  it("top-aligns right placement on short sidebar items", () => {
    const el = mockRect({ top: 504, left: 8, width: 213, height: 33 });
    const pos = computeTourPosition(el, "right", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    expect(pos.top).toBe(504);
    expect(pos.placement).toBe("right");
  });

  it("clamps campaigns step so tooltip does not overflow bottom", () => {
    const el = mockRect({ top: 678, left: 8, width: 213, height: 33 });
    const pos = computeTourPosition(el, "right", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    expect(pos.top + 190).toBeLessThanOrEqual(
      viewport.height - TOUR_VIEWPORT_PADDING,
    );
  });

  it("falls back to centered modal when anchor has zero size", () => {
    const el = mockRect({ top: 8, left: 22, width: 0, height: 0 });
    const pos = computeTourPosition(el, "right", viewport);
    expect(pos.top).toBeGreaterThan(100);
    expect(pos.left).toBeGreaterThan(200);
  });

  it("prefers top placement for billing anchor in footer zone", () => {
    const el = mockRect({ top: 775.25, left: 202, width: 32, height: 32 });
    const pos = computeTourPosition(el, "right", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 171,
    });
    expect(
      pos.placement === "top" ||
        pos.top + 171 <= viewport.height - TOUR_VIEWPORT_PADDING,
    ).toBe(true);
  });

  it("keeps right placement for tall filter sidebar (no footer flip)", () => {
    const el = mockRect({ top: 8, left: 240, width: 288, height: 932 });
    const pos = computeTourPosition(el, "right", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    expect(pos.placement).toBe("right");
    expect(pos.left).toBeGreaterThanOrEqual(240 + 288 + 12);
  });

  it("places left tooltip fully outside a right drawer", () => {
    const el = mockRect({ top: 8, left: 1263, width: 600, height: 934 });
    const pos = computeTourPosition(el, "left", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    expect(pos.left + TOUR_TOOLTIP_WIDTH).toBeLessThanOrEqual(1263 - 12);
  });

  it("clears left tooltip outside drawer when anchor is an inner title", () => {
    const panel = { top: 0, left: 1279, width: 600, height: 934 };
    const inner = { top: 16, left: 1356, width: 468, height: 22.5 };
    const el = {
      getBoundingClientRect: () => mockRect(inner).getBoundingClientRect(),
      closest: () => ({
        getBoundingClientRect: () => mockRect(panel).getBoundingClientRect(),
      }),
    } as Element;
    const pos = computeTourPosition(el, "left", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    expect(pos.left + TOUR_TOOLTIP_WIDTH).toBeLessThanOrEqual(1279 - 12);
  });

  it("centers bottom placement on moderately wide anchors", () => {
    const el = mockRect({ top: 100, left: 400, width: 500, height: 99 });
    const pos = computeTourPosition(el, "bottom", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    const anchorCenter = 400 + 500 / 2;
    expect(pos.left + TOUR_TOOLTIP_WIDTH / 2).toBeCloseTo(anchorCenter, 0);
    expect(pos.highlightRect?.height).toBe(99);
  });

  it("left-aligns bottom placement on very wide content anchors", () => {
    const el = mockRect({ top: 50, left: 540, width: 1337, height: 48 });
    const pos = computeTourPosition(el, "bottom", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    expect(pos.left).toBe(540);
  });

  it("top-aligns right placement on short anchors", () => {
    const el = mockRect({ top: 16, left: 253, width: 288, height: 45 });
    const pos = computeTourPosition(el, "right", viewport, {
      width: TOUR_TOOLTIP_WIDTH,
      height: 190,
    });
    expect(pos.placement).toBe("right");
    expect(pos.top).toBe(16);
  });

  it("condenses tall anchors to a top band", () => {
    const raw = {
      top: 8,
      left: 240,
      width: 288,
      height: 932,
      bottom: 940,
      right: 528,
      x: 240,
      y: 8,
      toJSON: () => ({}),
    } as DOMRect;
    const condensed = condenseAnchorRect(raw, viewport);
    expect(condensed.height).toBeLessThan(raw.height);
    expect(condensed.top).toBe(raw.top);
  });
});

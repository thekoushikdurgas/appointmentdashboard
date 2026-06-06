/// <reference types="vitest/globals" />
import {
  FILTER_SIDEBAR_COLLAPSED_WIDTH_PX,
  FILTER_SIDEBAR_EXPANDED_WIDTH_PX,
  filterAsideAnimateState,
  filterAsideVariants,
  filterBodySlideVariants,
  filterHeaderLabelVariants,
  resolveFilterSidebarAnimateState,
} from "./filterSidebarMotion";

describe("filterSidebarMotion", () => {
  it("maps collapsed flag to animate state", () => {
    expect(filterAsideAnimateState(false)).toBe("expanded");
    expect(filterAsideAnimateState(true)).toBe("collapsed");
  });

  it("defines expanded aside width matching layout CSS", () => {
    expect(filterAsideVariants.expanded).toMatchObject({
      width: FILTER_SIDEBAR_EXPANDED_WIDTH_PX,
      minWidth: 260,
    });
  });

  it("defines collapsed aside width as icon rail", () => {
    expect(filterAsideVariants.collapsed).toMatchObject({
      width: FILTER_SIDEBAR_COLLAPSED_WIDTH_PX,
    });
    expect(FILTER_SIDEBAR_COLLAPSED_WIDTH_PX).toBe(49);
    expect(FILTER_SIDEBAR_COLLAPSED_WIDTH_PX).toBeLessThan(
      FILTER_SIDEBAR_EXPANDED_WIDTH_PX,
    );
  });

  it("slides body content left when collapsed", () => {
    expect(filterBodySlideVariants.collapsed).toMatchObject({
      x: -20,
      opacity: 0,
    });
    expect(filterBodySlideVariants.expanded).toMatchObject({
      x: 0,
      opacity: 1,
    });
  });

  it("slides header labels left when collapsed", () => {
    expect(filterHeaderLabelVariants.collapsed).toMatchObject({
      x: -20,
      opacity: 0,
    });
    expect(filterHeaderLabelVariants.expanded).toMatchObject({
      x: 0,
      opacity: 1,
    });
  });

  describe("resolveFilterSidebarAnimateState", () => {
    it("returns expanded when panel is expanded", () => {
      expect(
        resolveFilterSidebarAnimateState({
          expanded: true,
          pinned: false,
          isHoverPeeking: false,
        }),
      ).toBe("expanded");
    });

    it("returns collapsed when panel is collapsed and not peeking", () => {
      expect(
        resolveFilterSidebarAnimateState({
          expanded: false,
          pinned: false,
          isHoverPeeking: false,
        }),
      ).toBe("collapsed");
    });

    it("returns expanded on hover peek when unpinned", () => {
      expect(
        resolveFilterSidebarAnimateState({
          expanded: false,
          pinned: false,
          isHoverPeeking: true,
        }),
      ).toBe("expanded");
    });

    it("ignores hover peek when pinned", () => {
      expect(
        resolveFilterSidebarAnimateState({
          expanded: false,
          pinned: true,
          isHoverPeeking: true,
        }),
      ).toBe("collapsed");
    });
  });
});

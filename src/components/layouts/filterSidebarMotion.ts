import type { Transition, Variants } from "framer-motion";

/** Expanded filter column width — matches `.c360-data-layout__filters`. */
export const FILTER_SIDEBAR_EXPANDED_WIDTH_PX = 300;

/** Icon rail width when collapsed — mirrors sidebar.md `3.05rem`. */
export const FILTER_SIDEBAR_COLLAPSED_WIDTH_PX = 49;

export type FilterSidebarAnimateState = "expanded" | "collapsed";

/** Shared tween from mydesigns sidebar (easeOut, 200ms). */
export const filterSidebarTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

export const filterAsideVariants: Variants = {
  expanded: {
    width: FILTER_SIDEBAR_EXPANDED_WIDTH_PX,
    minWidth: 260,
    maxWidth: FILTER_SIDEBAR_EXPANDED_WIDTH_PX,
  },
  collapsed: {
    width: FILTER_SIDEBAR_COLLAPSED_WIDTH_PX,
    minWidth: 0,
    maxWidth: FILTER_SIDEBAR_COLLAPSED_WIDTH_PX,
  },
};

/** Label slide — mirrors SessionNavBar `variants` in sidebar.md. */
export const filterHeaderLabelVariants: Variants = {
  expanded: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  collapsed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

export const filterHeaderStaggerVariants: Variants = {
  expanded: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
  collapsed: {
    transition: { staggerChildren: 0.02 },
  },
};

/** Label / body slide — mirrors SessionNavBar `variants` in sidebar.md. */
export const filterBodySlideVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
      opacity: { duration: 0.2 },
    },
  },
  collapsed: {
    opacity: 0,
    x: -20,
    height: 0,
    transition: {
      x: { stiffness: 100 },
      opacity: { duration: 0.15 },
      height: { duration: 0.2 },
    },
  },
};

export function filterAsideAnimateState(
  collapsed: boolean,
): FilterSidebarAnimateState {
  return collapsed ? "collapsed" : "expanded";
}

export function resolveFilterSidebarAnimateState({
  expanded,
  pinned,
  isHoverPeeking,
}: {
  expanded: boolean;
  pinned: boolean;
  isHoverPeeking: boolean;
}): FilterSidebarAnimateState {
  if (expanded || (isHoverPeeking && !pinned)) {
    return "expanded";
  }
  return "collapsed";
}

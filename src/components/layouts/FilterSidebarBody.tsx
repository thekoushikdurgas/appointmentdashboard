"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useOptionalDataFiltersPanelContext } from "@/context/DataFiltersPanelContext";
import { useOptionalFilterSidebarPeek } from "@/context/FilterSidebarPeekContext";
import {
  filterBodySlideVariants,
  filterHeaderStaggerVariants,
  filterSidebarTransition,
  resolveFilterSidebarAnimateState,
} from "@/components/layouts/filterSidebarMotion";
import { cn } from "@/lib/utils";

/** Animated filter sections wrapper; collapses when panel is unpinned + collapsed. */
export function FilterSidebarBody({ children }: { children: ReactNode }) {
  const panel = useOptionalDataFiltersPanelContext();
  const peek = useOptionalFilterSidebarPeek();
  const prefersReducedMotion = useReducedMotion();

  const collapsed = Boolean(panel?.collapseEnabled && !panel?.expanded);
  const animateState =
    peek?.effectiveAnimateState ??
    resolveFilterSidebarAnimateState({
      expanded: !collapsed,
      pinned: Boolean(panel?.pinned),
      isHoverPeeking: false,
    });

  const effectivelyCollapsed = animateState === "collapsed";
  const motionEnabled = Boolean(
    panel?.collapseEnabled && !prefersReducedMotion,
  );

  if (motionEnabled) {
    return (
      <motion.div
        className={cn(
          "c360-contacts-filters__body",
          "c360-contacts-filters__body--motion",
        )}
        initial={false}
        animate={animateState}
        variants={filterBodySlideVariants}
        transition={filterSidebarTransition}
        aria-hidden={effectivelyCollapsed ? true : undefined}
      >
        <motion.div
          className="c360-contacts-filters__body-inner"
          variants={filterHeaderStaggerVariants}
          initial={false}
          animate={animateState}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "c360-contacts-filters__body",
        effectivelyCollapsed && "c360-contacts-filters__body--collapsed",
      )}
      aria-hidden={effectivelyCollapsed ? true : undefined}
    >
      <div className="c360-contacts-filters__body-inner">{children}</div>
    </div>
  );
}

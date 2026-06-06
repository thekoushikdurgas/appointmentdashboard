"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Filter, FilterX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FilterSidebarPanelControls } from "@/components/layouts/FilterSidebarPanelControls";
import { useOptionalDataFiltersPanelContext } from "@/context/DataFiltersPanelContext";
import { useOptionalFilterSidebarPeek } from "@/context/FilterSidebarPeekContext";
import {
  filterHeaderLabelVariants,
  filterHeaderStaggerVariants,
  filterSidebarTransition,
  resolveFilterSidebarAnimateState,
} from "@/components/layouts/filterSidebarMotion";
import { cn } from "@/lib/utils";

export interface FilterSidebarHeaderProps {
  title?: string;
  titleId?: string;
  activeCount: number;
  subtitle?: string;
  headerActions?: ReactNode;
  onClear?: () => void;
  clearLabel?: string;
  showClear?: boolean;
  /** Icon-only actions visible in collapsed rail (e.g. refresh). */
  railActions?: ReactNode;
  /** When false, omits the title/subtitle block (rail icon + actions only). */
  showHeadText?: boolean;
  className?: string;
}

export function FilterSidebarHeader({
  title = "Filters",
  titleId,
  activeCount,
  subtitle,
  headerActions,
  onClear,
  clearLabel = "Clear",
  showClear,
  railActions,
  showHeadText = true,
  className,
}: FilterSidebarHeaderProps) {
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

  const isRail = animateState === "collapsed";
  const motionEnabled = Boolean(
    panel?.collapseEnabled && !prefersReducedMotion,
  );
  const resolvedSubtitle = subtitle ?? `${activeCount} active`;
  const shouldShowClear = showClear ?? (Boolean(onClear) && activeCount > 0);

  const expandedOnlyActions = (
    <>
      {headerActions}
      {shouldShowClear && onClear ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          leftIcon={<FilterX size={14} aria-hidden />}
          onClick={onClear}
        >
          {clearLabel}
        </Button>
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        "c360-contacts-filters__head-row",
        isRail && "c360-contacts-filters__head-row--collapsed",
        className,
      )}
    >
      <div
        className="c360-contacts-filters__rail"
        title={title}
        aria-label={`${title}${activeCount > 0 ? `, ${activeCount} active` : ""}`}
      >
        <Filter
          size={16}
          aria-hidden
          className="c360-contacts-filters__rail-icon"
        />
        {activeCount > 0 ? (
          <span className="c360-contacts-filters__rail-badge" aria-hidden>
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        ) : null}
      </div>

      {showHeadText ? (
        motionEnabled ? (
          <motion.div
            className="c360-contacts-filters__head-text"
            variants={filterHeaderStaggerVariants}
            initial={false}
            animate={animateState}
          >
            <motion.div
              className="c360-contacts-filters__head"
              variants={filterHeaderLabelVariants}
            >
              <h2 className="c360-contacts-filters__title" id={titleId}>
                {title}
              </h2>
              {activeCount > 0 ? (
                <span className="c360-contacts-filters__head-count" aria-hidden>
                  {activeCount}
                </span>
              ) : null}
            </motion.div>
            <motion.p
              className="c360-contacts-filters__subtitle"
              variants={filterHeaderLabelVariants}
            >
              {resolvedSubtitle}
            </motion.p>
          </motion.div>
        ) : (
          <div
            className={cn(
              "c360-contacts-filters__head-text",
              isRail && "c360-contacts-filters__head-text--hidden",
            )}
          >
            <div className="c360-contacts-filters__head">
              <h2 className="c360-contacts-filters__title" id={titleId}>
                {title}
              </h2>
              {activeCount > 0 ? (
                <span className="c360-contacts-filters__head-count" aria-hidden>
                  {activeCount}
                </span>
              ) : null}
            </div>
            <p className="c360-contacts-filters__subtitle">
              {resolvedSubtitle}
            </p>
          </div>
        )
      ) : null}

      <div
        className={cn(
          "c360-contacts-filters__head-actions",
          isRail && "c360-contacts-filters__head-actions--rail",
        )}
      >
        <FilterSidebarPanelControls />
        {railActions}
        {motionEnabled ? (
          <motion.div
            className="c360-contacts-filters__head-actions-expanded"
            initial={false}
            animate={animateState}
            variants={filterHeaderLabelVariants}
            transition={filterSidebarTransition}
          >
            {expandedOnlyActions}
          </motion.div>
        ) : (
          <div
            className={cn(
              "c360-contacts-filters__head-actions-expanded",
              isRail && "c360-contacts-filters__head-actions-expanded--hidden",
            )}
          >
            {expandedOnlyActions}
          </div>
        )}
      </div>
    </div>
  );
}

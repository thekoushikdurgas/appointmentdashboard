"use client";

import { useEffect } from "react";
import { useOptionalDataFiltersPanelContext } from "@/context/DataFiltersPanelContext";
import { TOUR_PREPARE_EVENT, type TourPrepareAction } from "@/lib/tourPrepare";

export interface HiringSignalsTourPrepareProps {
  onOpenSavedSearches: () => void;
  onOpenConnectraForTour: () => void;
  onClosePanels: () => void;
}

/**
 * Listens for onboarding tour prepare events while the hiring signals page is mounted.
 */
export function HiringSignalsTourPrepare({
  onOpenSavedSearches,
  onOpenConnectraForTour,
  onClosePanels,
}: HiringSignalsTourPrepareProps) {
  const panelCtx = useOptionalDataFiltersPanelContext();

  useEffect(() => {
    const onPrepare = (event: Event) => {
      const action = (event as CustomEvent<{ action?: TourPrepareAction }>)
        .detail?.action;
      if (action === "hs-open-filters") {
        panelCtx?.openFilters();
      } else if (action === "hs-open-connectra") {
        onOpenConnectraForTour();
      } else if (action === "hs-open-saved-searches") {
        onOpenSavedSearches();
      } else if (action === "hs-close-panels") {
        onClosePanels();
      }
    };

    window.addEventListener(TOUR_PREPARE_EVENT, onPrepare);
    return () => window.removeEventListener(TOUR_PREPARE_EVENT, onPrepare);
  }, [panelCtx, onOpenConnectraForTour, onOpenSavedSearches, onClosePanels]);

  return null;
}

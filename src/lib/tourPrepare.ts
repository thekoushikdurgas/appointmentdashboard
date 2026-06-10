export const TOUR_PREPARE_EVENT = "c360-tour-prepare";

export type TourPrepareAction =
  | "hs-open-filters"
  | "hs-open-company-contacts"
  | "hs-open-saved-searches"
  | "hs-close-panels";

export function dispatchTourPrepare(action: TourPrepareAction): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOUR_PREPARE_EVENT, { detail: { action } }),
  );
}

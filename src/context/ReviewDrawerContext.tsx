"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Sentinel href for command palette / synthetic nav (not a real route). */
export const REVIEW_DRAWER_NAV_HREF = "__c360_review_drawer__";

export type ReviewDrawerPreset = {
  externalJobId: string;
  jobSource: "scheduler" | "scrape";
};

type OpenRequest = {
  seq: number;
  preset: ReviewDrawerPreset | null;
};

export interface ReviewDrawerContextValue {
  isOpen: boolean;
  openRequest: OpenRequest;
  openReviewDrawer: (opts?: { preset?: ReviewDrawerPreset }) => void;
  closeReviewDrawer: () => void;
}

const ReviewDrawerContext = createContext<ReviewDrawerContextValue | null>(
  null,
);

export function ReviewDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState<OpenRequest>({
    seq: 0,
    preset: null,
  });

  const openReviewDrawer = useCallback(
    (opts?: { preset?: ReviewDrawerPreset }) => {
      setOpenRequest((r) => ({
        seq: r.seq + 1,
        preset: opts?.preset ?? null,
      }));
      setIsOpen(true);
    },
    [],
  );

  const closeReviewDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openRequest,
      openReviewDrawer,
      closeReviewDrawer,
    }),
    [isOpen, openRequest, openReviewDrawer, closeReviewDrawer],
  );

  return (
    <ReviewDrawerContext.Provider value={value}>
      {children}
    </ReviewDrawerContext.Provider>
  );
}

export function useReviewDrawer(): ReviewDrawerContextValue {
  const ctx = useContext(ReviewDrawerContext);
  if (!ctx) {
    throw new Error("useReviewDrawer must be used within ReviewDrawerProvider");
  }
  return ctx;
}

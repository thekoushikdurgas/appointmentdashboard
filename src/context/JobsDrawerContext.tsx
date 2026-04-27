"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Sentinel href for command palette / synthetic nav entries (not a real route). */
export const JOBS_DRAWER_NAV_HREF = "__c360_jobs_drawer__";

export type OpenJobsDrawerOptions = {
  jobFamily?: string;
};

type OpenRequest = {
  seq: number;
  jobFamily?: string;
};

export interface JobsDrawerContextValue {
  isOpen: boolean;
  openRequest: OpenRequest;
  openJobsDrawer: (opts?: OpenJobsDrawerOptions) => void;
  closeJobsDrawer: () => void;
}

const JobsDrawerContext = createContext<JobsDrawerContextValue | null>(null);

export function JobsDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState<OpenRequest>({ seq: 0 });

  const openJobsDrawer = useCallback((opts?: OpenJobsDrawerOptions) => {
    setOpenRequest((r) => {
      const next: OpenRequest = { seq: r.seq + 1 };
      if (opts?.jobFamily !== undefined) {
        next.jobFamily = opts.jobFamily;
      }
      return next;
    });
    setIsOpen(true);
  }, []);

  const closeJobsDrawer = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      openRequest,
      openJobsDrawer,
      closeJobsDrawer,
    }),
    [isOpen, openRequest, openJobsDrawer, closeJobsDrawer],
  );

  return (
    <JobsDrawerContext.Provider value={value}>
      {children}
    </JobsDrawerContext.Provider>
  );
}

export function useJobsDrawer(): JobsDrawerContextValue {
  const ctx = useContext(JobsDrawerContext);
  if (!ctx) {
    throw new Error("useJobsDrawer must be used within JobsDrawerProvider");
  }
  return ctx;
}

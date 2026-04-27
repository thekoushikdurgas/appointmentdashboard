"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Sentinel href for command palette / synthetic nav (not a real list route). */
export const FILES_DRAWER_NAV_HREF = "__c360_files_drawer__";

type OpenRequest = {
  seq: number;
};

export interface FilesDrawerContextValue {
  isOpen: boolean;
  openRequest: OpenRequest;
  openFilesDrawer: () => void;
  closeFilesDrawer: () => void;
}

const FilesDrawerContext = createContext<FilesDrawerContextValue | null>(null);

export function FilesDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openRequest, setOpenRequest] = useState<OpenRequest>({ seq: 0 });

  const openFilesDrawer = useCallback(() => {
    setOpenRequest((r) => ({ seq: r.seq + 1 }));
    setIsOpen(true);
  }, []);

  const closeFilesDrawer = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen,
      openRequest,
      openFilesDrawer,
      closeFilesDrawer,
    }),
    [isOpen, openRequest, openFilesDrawer, closeFilesDrawer],
  );

  return (
    <FilesDrawerContext.Provider value={value}>
      {children}
    </FilesDrawerContext.Provider>
  );
}

export function useFilesDrawer(): FilesDrawerContextValue {
  const ctx = useContext(FilesDrawerContext);
  if (!ctx) {
    throw new Error("useFilesDrawer must be used within FilesDrawerProvider");
  }
  return ctx;
}

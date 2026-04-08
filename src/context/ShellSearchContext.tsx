"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NavCommandPalette } from "@/components/shared/NavCommandPalette";

interface ShellSearchContextValue {
  openSearch: () => void;
  closeSearch: () => void;
  searchOpen: boolean;
}

const ShellSearchContext = createContext<ShellSearchContextValue | null>(null);

export function ShellSearchProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const value = useMemo(
    () => ({
      openSearch,
      closeSearch,
      searchOpen,
    }),
    [openSearch, closeSearch, searchOpen],
  );

  return (
    <ShellSearchContext.Provider value={value}>
      {children}
      <NavCommandPalette open={searchOpen} onClose={closeSearch} />
    </ShellSearchContext.Provider>
  );
}

export function useShellSearch(): ShellSearchContextValue {
  const ctx = useContext(ShellSearchContext);
  if (!ctx) {
    throw new Error("useShellSearch must be used within ShellSearchProvider");
  }
  return ctx;
}

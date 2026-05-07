"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TabsVariant =
  | "underline"
  | "contained"
  | "filter"
  | "dashboard"
  | "floating";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  children: React.ReactNode;
  className?: string;
}

function FloatingTabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("FloatingTabsList must be inside Tabs");

  const outerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });

  const updateIndicator = useCallback(() => {
    const outer = outerRef.current;
    const list = listRef.current;
    if (!outer || !list) return;
    const active = list.querySelector<HTMLButtonElement>(
      '[role="tab"][aria-selected="true"]',
    );
    if (!active) {
      setIndicator({ width: 0, left: 0 });
      return;
    }
    const o = outer.getBoundingClientRect();
    const b = active.getBoundingClientRect();
    setIndicator({
      width: b.width,
      left: b.left - o.left,
    });
  }, []);

  useLayoutEffect(() => {
    updateIndicator();
    const list = listRef.current;
    window.addEventListener("resize", updateIndicator);
    list?.addEventListener("scroll", updateIndicator, { passive: true });
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateIndicator);
    });
    if (list) {
      ro.observe(list);
      list.querySelectorAll('[role="tab"]').forEach((node) => ro.observe(node));
    }
    const outer = outerRef.current;
    if (outer) ro.observe(outer);
    return () => {
      window.removeEventListener("resize", updateIndicator);
      list?.removeEventListener("scroll", updateIndicator);
      ro.disconnect();
    };
  }, [ctx.activeTab, updateIndicator]);

  return (
    <div
      ref={outerRef}
      className={cn("c360-tabs__list--floating-wrap", className)}
    >
      <motion.div
        aria-hidden
        className="c360-tabs__floating-indicator"
        initial={false}
        animate={{
          width: indicator.width,
          left: indicator.left,
          opacity: indicator.width > 0 ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
      <div
        ref={listRef}
        className="c360-tabs__list c360-tabs__list--floating-track"
        role="tablist"
      >
        {children}
      </div>
    </div>
  );
}

export function Tabs({
  defaultValue = "",
  value,
  onValueChange,
  variant = "underline",
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internal;
  const setActiveTab = (id: string) => {
    if (value === undefined) setInternal(id);
    onValueChange?.(id);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant }}>
      <div
        className={cn(
          "c360-tabs",
          variant !== "underline" && `c360-tabs--${variant}`,
          className,
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsList must be inside Tabs");
  if (ctx.variant === "floating") {
    return (
      <FloatingTabsList className={className}>{children}</FloatingTabsList>
    );
  }
  return (
    <div className={cn("c360-tabs__list", className)} role="tablist">
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  icon,
  badge,
  className,
}: {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be inside Tabs");
  const isActive = ctx.activeTab === value;

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const list = e.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const idx = tabs.indexOf(e.currentTarget);
    if (idx === -1) return;
    const next =
      e.key === "ArrowRight"
        ? tabs[(idx + 1) % tabs.length]
        : tabs[(idx - 1 + tabs.length) % tabs.length];
    next?.focus();
    next?.click();
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        "c360-tabs__tab",
        isActive && "c360-tabs__tab--active",
        className,
      )}
      onClick={() => ctx.setActiveTab(value)}
      onKeyDown={handleKeyDown}
    >
      {icon ? (
        <span className="c360-tabs__tab-icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="c360-tabs__tab-text">{children}</span>
      {badge}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be inside Tabs");
  if (ctx.activeTab !== value) return null;
  return (
    <div role="tabpanel" className={cn("c360-tabs__panel", className)}>
      {children}
    </div>
  );
}

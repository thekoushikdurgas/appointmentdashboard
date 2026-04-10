"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type TabsVariant = "underline" | "contained" | "filter" | "dashboard";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
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
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
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
      {icon}
      {children}
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

"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { ShellSearchProvider } from "@/context/ShellSearchContext";
import { STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MOBILE_SIDEBAR_MQ = "(max-width: 1023px)";

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    if (stored === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_SIDEBAR_MQ);
    const sync = () => setIsNarrowViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  };

  const handleMobileToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  const handleMenuClick = () => {
    if (window.matchMedia(MOBILE_SIDEBAR_MQ).matches) {
      handleMobileToggle();
    } else {
      handleToggle();
    }
  };

  const menuButtonAriaLabel = isNarrowViewport
    ? mobileOpen
      ? "Close navigation"
      : "Open navigation"
    : collapsed
      ? "Expand sidebar"
      : "Collapse sidebar";

  return (
    <ShellSearchProvider>
      <div className="c360-shell">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={handleMobileClose}
        />
        <div className={cn("c360-main", collapsed && "c360-main--collapsed")}>
          <TopBar
            collapsed={collapsed}
            onMenuToggle={handleMenuClick}
            menuButtonAriaLabel={menuButtonAriaLabel}
            onAccountNavigate={handleMobileClose}
          />
          <main>{children}</main>
        </div>
      </div>
    </ShellSearchProvider>
  );
}

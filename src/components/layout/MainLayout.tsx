"use client";

import { useState, useEffect, useCallback, type MouseEvent } from "react";
import Sidebar from "./Sidebar";
import { MobileBottomDock } from "./MobileBottomDock";
import { ShellSearchProvider } from "@/context/ShellSearchContext";
import { JobsDrawerProvider } from "@/context/JobsDrawerContext";
import { NotificationsDrawerProvider } from "@/context/NotificationsDrawerContext";
import { FilesDrawerProvider } from "@/context/FilesDrawerContext";
import { ReviewDrawerProvider } from "@/context/ReviewDrawerContext";
import { JobsDrawer } from "@/components/feature/jobs/JobsDrawer";
import { NotificationsDrawer } from "@/components/feature/notifications/NotificationsDrawer";
import { FilesDrawer } from "@/components/feature/files/FilesDrawer";
import { ReviewDrawer } from "@/components/feature/reviews/ReviewDrawer";
import { STORAGE_KEYS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/ContextMenu";
import { AccountMenuPanel } from "./AccountMenuPanel";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MOBILE_SIDEBAR_MQ = "(max-width: 1023px)";

/** Keep native context menu in form fields; block it elsewhere so only the account menu appears. */
function isEditableContextTarget(el: HTMLElement | null): boolean {
  if (!el) return false;
  return Boolean(
    el.closest(
      'input, textarea, select, [contenteditable="true"], [role="textbox"]',
    ),
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [sidebarPeek, setSidebarPeek] = useState(false);

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

  useEffect(() => {
    if (isNarrowViewport) setSidebarPeek(false);
  }, [isNarrowViewport]);

  const toggleCollapsed = useCallback(() => {
    setSidebarPeek(false);
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      } catch {
        /* quota / private mode */
      }
      return next;
    });
  }, []);

  const handleMobileToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  const stopAccountMenuForEditableFields = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (isEditableContextTarget(e.target as HTMLElement | null)) {
        e.stopPropagation();
      }
    },
    [],
  );

  const shellClass = cn(
    "c360-shell",
    sidebarPeek && "c360-shell--sidebar-peek",
    isNarrowViewport && "c360-shell--narrow-dock",
  );

  const shellBody = (
    <div
      className="c360-shell__context-bubble-guard"
      onContextMenu={stopAccountMenuForEditableFields}
    >
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        peekAllowed={!isNarrowViewport && collapsed}
        onPeekChange={setSidebarPeek}
        peekOpen={sidebarPeek}
        showDesktopCollapseToggle={!isNarrowViewport}
        onToggleCollapse={toggleCollapsed}
      />
      <div className={cn("c360-main", collapsed && "c360-main--collapsed")}>
        <main>{children}</main>
      </div>
      <MobileBottomDock
        visible={isNarrowViewport}
        mobileDrawerOpen={mobileOpen}
        onToggleSidebarDrawer={handleMobileToggle}
        onNavigate={handleMobileClose}
      />
    </div>
  );

  return (
    <ReviewDrawerProvider>
      <JobsDrawerProvider>
        <NotificationsDrawerProvider>
          <FilesDrawerProvider>
            <ShellSearchProvider>
              {user ? (
                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <div className={shellClass}>{shellBody}</div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="c360-context-menu__content--account">
                    <AccountMenuPanel onAccountNavigate={handleMobileClose} />
                  </ContextMenuContent>
                </ContextMenu>
              ) : (
                <div className={shellClass}>{shellBody}</div>
              )}
            </ShellSearchProvider>
            <JobsDrawer />
            <NotificationsDrawer />
            <FilesDrawer />
            <ReviewDrawer />
          </FilesDrawerProvider>
        </NotificationsDrawerProvider>
      </JobsDrawerProvider>
    </ReviewDrawerProvider>
  );
}

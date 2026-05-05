"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
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

interface MainLayoutProps {
  children: React.ReactNode;
}

const MOBILE_SIDEBAR_MQ = "(max-width: 1023px)";

export default function MainLayout({ children }: MainLayoutProps) {
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

  const handleMobileToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  return (
    <ReviewDrawerProvider>
      <JobsDrawerProvider>
        <NotificationsDrawerProvider>
          <FilesDrawerProvider>
            <ShellSearchProvider>
              <div
                className={cn(
                  "c360-shell",
                  sidebarPeek && "c360-shell--sidebar-peek",
                  isNarrowViewport && "c360-shell--narrow-dock",
                )}
              >
                <Sidebar
                  collapsed={collapsed}
                  mobileOpen={mobileOpen}
                  onMobileClose={handleMobileClose}
                  peekAllowed={!isNarrowViewport && collapsed}
                  onPeekChange={setSidebarPeek}
                  peekOpen={sidebarPeek}
                />
                <div
                  className={cn(
                    "c360-main",
                    collapsed && "c360-main--collapsed",
                  )}
                >
                  <TopBar
                    collapsed={collapsed}
                    onAccountNavigate={handleMobileClose}
                  />
                  <main>{children}</main>
                </div>
                <MobileBottomDock
                  visible={isNarrowViewport}
                  mobileDrawerOpen={mobileOpen}
                  onToggleSidebarDrawer={handleMobileToggle}
                  onNavigate={handleMobileClose}
                />
              </div>
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

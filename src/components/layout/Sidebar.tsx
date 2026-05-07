"use client";
import { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Activity,
  Users,
  Building2,
  Mail,
  Phone,
  Megaphone,
  Linkedin,
  MessageSquare,
  Mic,
  Plus,
  LayoutTemplate,
  ListOrdered,
  FileText,
  Database,
  Brain,
  Wrench,
  Zap,
  PanelLeft,
  PanelRight,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { SIDEBAR_SECTIONS, ROUTES } from "@/lib/constants";
import type { SidebarSectionConfig } from "@/lib/constants";
import { usePathname } from "next/navigation";
import { useRole } from "@/context/RoleContext";
import { SidebarSearch } from "@/components/shared/SidebarSearch";
import { SidebarNav } from "./SidebarNav";
import { SidebarQuickActions } from "./SidebarQuickActions";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Activity,
  Users,
  Building2,
  Mail,
  Phone,
  Megaphone,
  Linkedin,
  MessageSquare,
  Mic,
  Plus,
  LayoutTemplate,
  ListOrdered,
  FileText,
  Database,
  Brain,
  Tool: Wrench,
  Zap,
};

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  /** Desktop collapsed rail: optional hover peek (pointer fine + motion OK). */
  peekAllowed?: boolean;
  onPeekChange?: (peek: boolean) => void;
  /** When true, show full labels on a collapsed rail (hover peek). */
  peekOpen?: boolean;
  /** Desktop: sidebar rail collapse control (moved from former top bar). */
  showDesktopCollapseToggle?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
  peekAllowed = false,
  onPeekChange,
  peekOpen = false,
  showDesktopCollapseToggle = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin } = useRole();
  const prefersReducedMotion = useReducedMotion();
  const finePointer = useStateFinePointer();
  const railCollapsed = collapsed && !peekOpen;

  const visibleSections = useMemo((): SidebarSectionConfig[] => {
    return SIDEBAR_SECTIONS.filter(
      (s) => !s.requiresSuperAdmin || isSuperAdmin,
    );
  }, [isSuperAdmin]);

  const iconFor = (key: string) => ICON_MAP[key];

  const settingsActive =
    pathname === ROUTES.SETTINGS || pathname.startsWith(`${ROUTES.SETTINGS}/`);

  const peekActive =
    peekAllowed &&
    !prefersReducedMotion &&
    finePointer &&
    !mobileOpen &&
    collapsed;

  useEffect(() => {
    if (!collapsed) onPeekChange?.(false);
  }, [collapsed, onPeekChange]);

  const handlePeekEnter = () => {
    if (peekActive) onPeekChange?.(true);
  };

  const handlePeekLeave = () => {
    onPeekChange?.(false);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="c360-sidebar-overlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        id="c360-app-sidebar"
        className={cn(
          "c360-sidebar",
          collapsed && "c360-sidebar--collapsed",
          collapsed && peekOpen && "c360-sidebar--rail-expanded",
          mobileOpen && "c360-sidebar--mobile-open",
        )}
        aria-label="Main navigation"
        onMouseEnter={handlePeekEnter}
        onMouseLeave={handlePeekLeave}
      >
        <div className="c360-sidebar__header">
          <div
            className={cn(
              "c360-sidebar__header-row",
              showDesktopCollapseToggle &&
                onToggleCollapse &&
                "c360-sidebar__header-row--with-collapse",
            )}
          >
            {showDesktopCollapseToggle && onToggleCollapse ? (
              <button
                type="button"
                className="c360-btn c360-btn--ghost c360-btn--icon c360-sidebar__header-collapse"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={onToggleCollapse}
              >
                {collapsed ? (
                  <PanelRight size={20} aria-hidden />
                ) : (
                  <PanelLeft size={20} aria-hidden />
                )}
              </button>
            ) : null}
            <Link
              href={ROUTES.DASHBOARD}
              className="c360-sidebar__brand"
              onClick={onMobileClose}
            >
              <span className="c360-sidebar__brand-mark" aria-hidden>
                C
              </span>
              <span className="c360-sidebar__brand-text">Contact360</span>
            </Link>
          </div>
        </div>

        <div className="c360-sidebar__search">
          <SidebarSearch collapsed={railCollapsed} />
        </div>

        <SidebarQuickActions
          railCollapsed={railCollapsed}
          onMobileClose={onMobileClose}
        />

        <div className="c360-sidebar__main">
          <nav className="c360-sidebar__nav" aria-label="Primary navigation">
            <SidebarNav
              collapsed={railCollapsed}
              sections={visibleSections}
              onMobileClose={onMobileClose}
              iconFor={iconFor}
            />
          </nav>
        </div>

        <div className="c360-sidebar__footer">
          <Link
            href={ROUTES.SETTINGS}
            className={cn(
              "c360-sidebar__footer-link",
              "c360-sidebar__item",
              "c360-sidebar__item--leaf",
              railCollapsed && "c360-sidebar__item--collapsed-icon",
              settingsActive && "c360-sidebar__item--active",
            )}
            onClick={onMobileClose}
            title="Settings"
            aria-label="Settings"
            aria-current={settingsActive ? "page" : undefined}
          >
            <Settings
              size={railCollapsed ? 20 : 16}
              className="c360-sidebar__item-icon"
              aria-hidden
            />
            <span className="c360-sidebar__item-label">Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

function useStateFinePointer(): boolean {
  const [fine, setFine] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return fine;
}

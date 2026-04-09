"use client";
import { useMemo } from "react";
import {
  LayoutDashboard,
  BarChart2,
  Activity,
  Users,
  Building2,
  Mail,
  Briefcase,
  FolderOpen,
  Upload,
  Download,
  Megaphone,
  Linkedin,
  MessageSquare,
  Mic,
  CreditCard,
  PieChart,
  User,
  Settings,
  CheckCircle,
  Bell,
  Bookmark,
  Plus,
  LayoutTemplate,
  ListOrdered,
  FileText,
  Database,
  Brain,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SIDEBAR_SECTIONS,
  mergeAccessiblePagesIntoSidebarSections,
} from "@/lib/constants";
import type { SidebarSectionConfig } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { useRole } from "@/context/RoleContext";
import { SidebarSearch } from "@/components/shared/SidebarSearch";
import { SidebarNav } from "./SidebarNav";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  BarChart2,
  Activity,
  Users,
  Building2,
  Mail,
  Briefcase,
  FolderOpen,
  Upload,
  Download,
  Megaphone,
  Linkedin,
  MessageSquare,
  Mic,
  CreditCard,
  PieChart,
  User,
  Settings,
  CheckCircle,
  Bell,
  Bookmark,
  Plus,
  LayoutTemplate,
  ListOrdered,
  FileText,
  Database,
  Brain,
  Tool: Wrench,
};

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { isSuperAdmin } = useRole();
  const { accessiblePages } = useAuth();

  const visibleSections = useMemo((): SidebarSectionConfig[] => {
    const filtered = SIDEBAR_SECTIONS.filter(
      (s) => !s.requiresSuperAdmin || isSuperAdmin,
    );
    return mergeAccessiblePagesIntoSidebarSections(filtered, accessiblePages);
  }, [isSuperAdmin, accessiblePages]);

  const iconFor = (key: string) => ICON_MAP[key];

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
        className={cn(
          "c360-sidebar",
          collapsed && "c360-sidebar--collapsed",
          mobileOpen && "c360-sidebar--mobile-open",
        )}
        aria-label="Main navigation"
      >
        <div className="c360-sidebar__search">
          <SidebarSearch collapsed={collapsed} />
        </div>

        <nav className="c360-sidebar__nav" aria-label="Primary navigation">
          <SidebarNav
            collapsed={collapsed}
            sections={visibleSections}
            onMobileClose={onMobileClose}
            iconFor={iconFor}
          />
        </nav>
      </aside>
    </>
  );
}

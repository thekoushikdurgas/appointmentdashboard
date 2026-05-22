"use client";

import { Bell, Briefcase, FolderOpen, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useJobsDrawer } from "@/context/JobsDrawerContext";
import { useNotificationsDrawer } from "@/context/NotificationsDrawerContext";
import { useFilesDrawer } from "@/context/FilesDrawerContext";
import { useReviewDrawer } from "@/context/ReviewDrawerContext";
import { cn } from "@/lib/utils";

interface SidebarQuickActionsProps {
  /** Collapsed icon rail: tighter vertical stack */
  railCollapsed: boolean;
  onMobileClose?: () => void;
}

export function SidebarQuickActions({
  railCollapsed,
  onMobileClose,
}: SidebarQuickActionsProps) {
  const { openJobsDrawer } = useJobsDrawer();
  const { openNotificationsDrawer, unreadCount } = useNotificationsDrawer();
  const { openFilesDrawer } = useFilesDrawer();
  const { openReviewDrawer } = useReviewDrawer();

  const wrap = () => onMobileClose?.();

  return (
    <div
      className={cn(
        "c360-sidebar__quick-actions",
        railCollapsed && "c360-sidebar__quick-actions--rail",
      )}
      data-rail-collapsed={railCollapsed ? "true" : "false"}
      role="toolbar"
      aria-label="Quick actions"
      {...(railCollapsed ? { "aria-orientation": "vertical" as const } : {})}
    >
      <button
        type="button"
        className="c360-btn c360-btn--ghost c360-btn--icon c360-sidebar__quick-btn"
        title="Review tickets"
        aria-label="Open review tickets"
        onClick={() => {
          openReviewDrawer();
          wrap();
        }}
      >
        <MessageSquare size={railCollapsed ? 16 : 18} aria-hidden />
      </button>
      <button
        type="button"
        className="c360-btn c360-btn--ghost c360-btn--icon c360-sidebar__quick-btn"
        title="Notifications"
        aria-label={
          unreadCount > 0
            ? `Open notifications, ${unreadCount} unread`
            : "Open notifications"
        }
        onClick={() => {
          openNotificationsDrawer();
          wrap();
        }}
      >
        <span className="c360-topbar-notif-wrap">
          <Bell size={railCollapsed ? 16 : 18} aria-hidden />
          {unreadCount > 0 ? (
            <Badge color="red" className="c360-topbar-notif-badge" aria-hidden>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        className="c360-btn c360-btn--ghost c360-btn--icon c360-sidebar__quick-btn"
        title="Jobs"
        aria-label="Open jobs"
        onClick={() => {
          openJobsDrawer();
          wrap();
        }}
      >
        <Briefcase size={railCollapsed ? 16 : 18} aria-hidden />
      </button>
      <button
        type="button"
        className="c360-btn c360-btn--ghost c360-btn--icon c360-sidebar__quick-btn"
        title="Files"
        aria-label="Open files"
        onClick={() => {
          openFilesDrawer();
          wrap();
        }}
      >
        <FolderOpen size={railCollapsed ? 16 : 18} aria-hidden />
      </button>
    </div>
  );
}

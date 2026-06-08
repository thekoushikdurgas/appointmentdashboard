"use client";

import { Bell, FolderOpen, MessageSquare } from "lucide-react";
import { ExportDrawerIcon } from "@/components/ui/ExportDrawerIcon";
import { STORAGE_DRAWER_DISPLAY_NAME } from "@/lib/files/storageDrawerUi";
import { EXPORT_DRAWER_DISPLAY_NAME } from "@/lib/jobs/exportDrawerUi";
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
  /** Match footer account rail buttons (no toolbar wrapper). */
  integrated?: boolean;
}

const railActionClass = cn(
  "c360-sidebar__item",
  "c360-sidebar__item--leaf",
  "c360-sidebar__item--collapsed-icon",
  "c360-sidebar-account-compact__btn",
  "c360-sidebar-account__rail-action",
);

export function SidebarQuickActions({
  railCollapsed,
  onMobileClose,
  integrated = false,
}: SidebarQuickActionsProps) {
  const { openJobsDrawer } = useJobsDrawer();
  const { openNotificationsDrawer, unreadCount } = useNotificationsDrawer();
  const { openFilesDrawer } = useFilesDrawer();
  const { openReviewDrawer } = useReviewDrawer();

  const wrap = () => onMobileClose?.();
  const useRailButtons = railCollapsed && integrated;
  const buttonClass = useRailButtons
    ? railActionClass
    : "c360-btn c360-btn--ghost c360-btn--icon c360-sidebar__quick-btn";

  const actions = (
    <>
      <button
        type="button"
        className={buttonClass}
        title="Review tickets"
        aria-label="Open review tickets"
        onClick={() => {
          openReviewDrawer();
          wrap();
        }}
      >
        <MessageSquare
          size={18}
          className={useRailButtons ? "c360-sidebar__item-icon" : undefined}
          aria-hidden
        />
      </button>
      <button
        type="button"
        className={buttonClass}
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
          <Bell
            size={18}
            className={useRailButtons ? "c360-sidebar__item-icon" : undefined}
            aria-hidden
          />
          {unreadCount > 0 ? (
            <Badge color="red" className="c360-topbar-notif-badge" aria-hidden>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        className={buttonClass}
        title={EXPORT_DRAWER_DISPLAY_NAME}
        aria-label={`Open ${EXPORT_DRAWER_DISPLAY_NAME.toLowerCase()}`}
        onClick={() => {
          openJobsDrawer();
          wrap();
        }}
      >
        <ExportDrawerIcon
          size={18}
          className={useRailButtons ? "c360-sidebar__item-icon" : undefined}
        />
      </button>
      <button
        type="button"
        className={buttonClass}
        title={STORAGE_DRAWER_DISPLAY_NAME}
        aria-label={`Open ${STORAGE_DRAWER_DISPLAY_NAME.toLowerCase()}`}
        onClick={() => {
          openFilesDrawer();
          wrap();
        }}
      >
        <FolderOpen
          size={18}
          className={useRailButtons ? "c360-sidebar__item-icon" : undefined}
          aria-hidden
        />
      </button>
    </>
  );

  if (useRailButtons) {
    return actions;
  }

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
      {actions}
    </div>
  );
}

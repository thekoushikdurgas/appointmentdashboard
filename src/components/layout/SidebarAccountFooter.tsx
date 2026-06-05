"use client";

import { AccountMenuContent } from "@/components/layout/AccountMenuPanel";

export interface SidebarAccountFooterProps {
  railCollapsed: boolean;
  onMobileClose?: () => void;
}

export function SidebarAccountFooter({
  railCollapsed,
  onMobileClose,
}: SidebarAccountFooterProps) {
  return (
    <AccountMenuContent
      mode={railCollapsed ? "sidebar-compact" : "sidebar-full"}
      onNavigate={onMobileClose}
    />
  );
}

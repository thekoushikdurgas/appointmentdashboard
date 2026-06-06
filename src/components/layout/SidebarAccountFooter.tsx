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
      mode="sidebar-full"
      accountBodyExpanded={!railCollapsed}
      onNavigate={onMobileClose}
    />
  );
}

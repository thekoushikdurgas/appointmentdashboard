"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useNotificationsDrawer } from "@/context/NotificationsDrawerContext";

/**
 * Legacy `/notifications` URL: open the global notifications drawer and return to the dashboard.
 */
export default function LegacyNotificationsListRoutePage() {
  const router = useRouter();
  const { openNotificationsDrawer } = useNotificationsDrawer();

  useEffect(() => {
    openNotificationsDrawer();
    router.replace(ROUTES.DASHBOARD);
  }, [openNotificationsDrawer, router]);

  return (
    <div className="c360-dashboard-loading-shell">
      <span className="c360-spinner" aria-label="Opening notifications…" />
    </div>
  );
}

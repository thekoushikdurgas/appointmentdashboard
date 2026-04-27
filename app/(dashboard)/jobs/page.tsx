"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useJobsDrawer } from "@/context/JobsDrawerContext";

/**
 * Legacy `/jobs` URL: open the global Jobs drawer and return to the dashboard.
 * Bookmarks and old links continue to work without a dedicated full-page route.
 */
export default function LegacyJobsRoutePage() {
  const router = useRouter();
  const { openJobsDrawer } = useJobsDrawer();

  useEffect(() => {
    openJobsDrawer();
    router.replace(ROUTES.DASHBOARD);
  }, [openJobsDrawer, router]);

  return (
    <div className="c360-dashboard-loading-shell">
      <span className="c360-spinner" aria-label="Opening jobs…" />
    </div>
  );
}

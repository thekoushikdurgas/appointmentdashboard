"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { useFilesDrawer } from "@/context/FilesDrawerContext";

/**
 * Legacy `/files` URL: open the global Files drawer and return to the dashboard.
 */
export default function LegacyFilesRoutePage() {
  const router = useRouter();
  const { openFilesDrawer } = useFilesDrawer();

  useEffect(() => {
    openFilesDrawer();
    router.replace(ROUTES.DASHBOARD);
  }, [openFilesDrawer, router]);

  return (
    <div className="c360-dashboard-loading-shell">
      <span className="c360-spinner" aria-label="Opening files…" />
    </div>
  );
}

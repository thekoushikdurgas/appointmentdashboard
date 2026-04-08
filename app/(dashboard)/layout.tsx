"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/constants";
import { WebVitalsReporter } from "@/components/shared/WebVitalsReporter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="c360-dashboard-loading-shell">
        <span className="c360-spinner" aria-label="Loading..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <WebVitalsReporter />
      {children}
    </>
  );
}

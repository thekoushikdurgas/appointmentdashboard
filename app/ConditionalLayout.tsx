"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { ShellSuspenseFallback } from "@/components/shared/ShellSuspenseFallback";
import { useAuth } from "@/context/AuthContext";
import { RouteTracker } from "@/hooks/useRouteTracker";
import { RouteActivityTracker } from "@/hooks/useRouteActivityTracker";

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/lock-screen",
];
const FULL_SCREEN_ROUTES = ["/403", "/404", "/400", "/500", "/503"];

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

function ConditionalLayoutInner({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { loading } = useAuth();

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isFullScreen = FULL_SCREEN_ROUTES.some((r) => pathname.startsWith(r));

  if (isAuthRoute || isFullScreen) {
    return <>{children}</>;
  }

  if (loading) {
    return <ShellSuspenseFallback />;
  }

  return (
    <>
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>
      <RouteActivityTracker />
      <MainLayout>{children}</MainLayout>
    </>
  );
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  return (
    <Suspense fallback={<ShellSuspenseFallback />}>
      <ConditionalLayoutInner>{children}</ConditionalLayoutInner>
    </Suspense>
  );
}

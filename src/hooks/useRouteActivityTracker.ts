"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { graphqlMutation } from "@/lib/graphqlClient";
import { validatePostLoginRoute } from "@/lib/returnRoute";
import { useAuth } from "@/context/AuthContext";

const LOG_ACTIVITY_MUTATION = `
  mutation LogNavigationActivity($input: LogActivityInput!) {
    activities {
      logActivity(input: $input)
    }
  }
`;

/** Log authenticated page views to user_activities (server rate-limited). */
export function useRouteActivityTracker(): void {
  const pathname = usePathname();
  const { user } = useAuth();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const route = validatePostLoginRoute(pathname);
    if (!route || route === lastLogged.current) return;
    lastLogged.current = route;

    graphqlMutation<{ activities: { logActivity: boolean } }>(
      LOG_ACTIVITY_MUTATION,
      { input: { route } },
      { showToastOnError: false },
    ).catch(() => undefined);
  }, [pathname, user]);
}

export function RouteActivityTracker(): null {
  useRouteActivityTracker();
  return null;
}

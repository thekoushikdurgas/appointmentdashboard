import type { GatewayPageSummary } from "@/types/graphql-gateway";

type PagesListener = (pages: GatewayPageSummary[]) => void;

let listener: PagesListener | null = null;

/** AuthProvider registers to keep `accessiblePages` in sync after silent token refresh. */
export function registerAuthPagesRefreshHandler(
  handler: PagesListener | null,
): void {
  listener = handler;
}

export function notifyAuthPagesRefreshed(
  pages: GatewayPageSummary[] | null | undefined,
): void {
  if (pages && listener) listener(pages);
}

/** User-facing name for the global scheduler jobs drawer (formerly "Jobs"). */
export const EXPORT_DRAWER_DISPLAY_NAME = "Export";

export function isExportDrawerServiceType(serviceType: string): boolean {
  return serviceType.trim().toLowerCase() === "jobs";
}

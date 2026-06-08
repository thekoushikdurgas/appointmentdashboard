/** User-facing name for the global S3 files drawer (formerly "Files"). */
export const STORAGE_DRAWER_DISPLAY_NAME = "Storage";

export function isStorageDrawerServiceType(serviceType: string): boolean {
  return serviceType.trim().toLowerCase() === "files";
}

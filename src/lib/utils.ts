/**
 * Utility functions — cn() class merger, date formatters, number formatters, string utils.
 */

import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names (via `clsx`; this app does not use Tailwind). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Format a date as "Jan 1, 2024" */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/** Format a date as relative time: "2 hours ago" */
export function formatRelativeTime(
  date: string | Date | null | undefined,
): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60) return "just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
    return formatDate(d);
  } catch {
    return "—";
  }
}

/** Format a number with commas: 1234567 → "1,234,567" */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

/** Format as compact: 12345 → "12.3K" */
export function formatCompact(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Format as currency: 1234 → "$1,234.00" */
export function formatCurrency(
  value: number | null | undefined,
  currency = "USD",
): string {
  if (value == null || isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    value,
  );
}

/** Truncate a string to a max length */
export function truncate(str: string, maxLength: number): string {
  if (!str) return "";
  return str.length <= maxLength ? str : `${str.slice(0, maxLength)}…`;
}

/** Generate initials from a name: "John Doe" → "JD" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** Pluralize: pluralize("result", 3) → "results" */
export function pluralize(word: string, count: number, suffix = "s"): string {
  return count === 1 ? word : `${word}${suffix}`;
}

/** Generate avatar URL from name */
export function getAvatarUrl(name: string, size = 40): string {
  const encoded = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${encoded}&size=${size}&background=2f4cdd&color=fff&bold=true`;
}

/** Prefer API `avatarUrl` (any absolute/relative URL); otherwise generated initials avatar. */
export function resolveProfileAvatarSrc(
  avatarUrl: string | null | undefined,
  displayName: string,
  email: string,
  size = 64,
): string {
  const trimmed = (avatarUrl ?? "").trim();
  if (trimmed) {
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/")) return trimmed;
  }
  return getAvatarUrl(displayName || email || "User", size);
}

/** Sleep helper */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Coerces S3 `file.size` (GraphQL BigInt as string/number) to a safe integer ≥ 0.
 * Invalid or negative values become 0 (schema expects a positive byte count for real objects).
 */
export function normalizeS3FileSizeBytes(
  size: string | number | bigint | null | undefined,
): number {
  if (size == null || size === "") return 0;
  try {
    let n: number;
    if (typeof size === "bigint") {
      n = Number(size);
    } else if (typeof size === "string") {
      n = Number(size.trim());
    } else {
      n = size;
    }
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.floor(n), Number.MAX_SAFE_INTEGER);
  } catch {
    return 0;
  }
}

/** Format file size: 1048576 → "1.00 MB". Clamps to a non-negative integer. */
export function formatFileSize(bytes: number | null | undefined): string {
  const b =
    bytes == null || !Number.isFinite(bytes) || bytes < 0
      ? 0
      : Math.min(Math.floor(bytes), Number.MAX_SAFE_INTEGER);
  if (b === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = b;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
}

/** Download a blob as a file */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Parse CSV text into rows */
export function parseCSV(text: string): string[][] {
  return text
    .split("\n")
    .filter(Boolean)
    .map((row) =>
      row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")),
    );
}

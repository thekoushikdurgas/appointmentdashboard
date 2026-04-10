/**
 * Receipt images for manual UPI proof — MIME normalization (Windows/pjpeg, octet-stream, etc.).
 */

const JPEG_LIKE = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/x-cjpeg",
]);

function baseMime(file: File): string {
  let t = (file.type || "").trim().toLowerCase();
  const semi = t.indexOf(";");
  if (semi >= 0) t = t.slice(0, semi).trim();
  return t;
}

/**
 * Canonical MIME for GraphQL + s3storage photo upload: image/jpeg | image/png | image/webp.
 */
export function normalizeReceiptMimeForApi(file: File): string {
  const t = baseMime(file);
  if (JPEG_LIKE.has(t)) return "image/jpeg";
  if (t === "image/png") return "image/png";
  if (t === "image/webp") return "image/webp";

  if (t === "" || t === "application/octet-stream") {
    const n = file.name.toLowerCase();
    if (n.endsWith(".png")) return "image/png";
    if (n.endsWith(".webp")) return "image/webp";
    if (n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".jpe")) {
      return "image/jpeg";
    }
  }

  throw new Error(
    "Please use a JPEG, PNG, or WebP image. If this is a JPEG, try renaming to .jpg or .jpeg.",
  );
}

export function isAllowedReceiptImageFile(file: File): boolean {
  try {
    normalizeReceiptMimeForApi(file);
    return true;
  } catch {
    return false;
  }
}

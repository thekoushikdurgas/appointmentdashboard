import { billingService } from "@/services/graphql/billingService";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

function paymentReceiptMimeType(file: File): string {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type;
  }
  const n = file.name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  throw new Error(
    "Please use a JPEG, PNG, or WebP image (or use a file extension .jpg, .jpeg, .png, .webp).",
  );
}

function fileToBase64Payload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

/**
 * Upload a payment receipt via API → s3storage `POST /uploads/photo` (not initiate-csv).
 * Returns the S3 object key relative to the user's logical bucket.
 */
export async function uploadPaymentReceiptImage(file: File): Promise<string> {
  const mime = paymentReceiptMimeType(file);
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  const imageBase64 = await fileToBase64Payload(file);
  const res = await billingService.uploadPaymentReceiptPhoto({
    imageBase64,
    mimeType: mime,
  });
  return res.billing.uploadPaymentReceiptPhoto.fileKey;
}

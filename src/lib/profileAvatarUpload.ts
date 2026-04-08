const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function assertAvatarFileSize(file: File): void {
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image must be 5MB or smaller (JPEG, PNG, GIF, or WebP).");
  }
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

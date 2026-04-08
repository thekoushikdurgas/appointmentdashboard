/** TOTP codes from authenticator apps are 6 digits (API validates length). */
export const TOTP_CODE_LENGTH = 6;

/** Strip non-digits and keep at most six characters for `verify2FA`. */
export function normalizeTotpCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, TOTP_CODE_LENGTH);
}

export function isValidTotpCode(normalized: string): boolean {
  return normalized.length === TOTP_CODE_LENGTH;
}

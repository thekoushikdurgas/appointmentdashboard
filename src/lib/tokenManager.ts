/**
 * Token Manager — JWT token storage, retrieval, and expiration checking.
 * Aligns with contact360 auth module (access/refresh tokens).
 */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    const exp = decoded.exp as number;
    const bufferTime = 60 * 1000;
    return Date.now() > exp * 1000 - bufferTime;
  } catch {
    return true;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  return token !== null && !isTokenExpired(token);
}

export function getUserIdFromToken(): string | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const decoded = decodeToken(token);
    if (!decoded) return null;
    const userId =
      decoded.user_id ?? decoded.userId ?? decoded.sub ?? decoded.id;
    return typeof userId === "string" ? userId : null;
  } catch {
    return null;
  }
}

export function getTokenExpiration(token: string | null): number | null {
  if (!token) return null;
  try {
    const decoded = decodeToken(token);
    if (!decoded || typeof decoded.exp !== "number") return null;
    return (decoded.exp as number) * 1000;
  } catch {
    return null;
  }
}

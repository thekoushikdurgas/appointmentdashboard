/**
 * Token Manager — JWT token storage, retrieval, and expiration checking.
 * Aligns with contact360 auth module (access/refresh tokens).
 */

import {
  tryLocalStorageGet,
  tryLocalStorageRemove,
  tryLocalStorageSet,
} from "@/lib/safeLocalStorage";

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
  return tryLocalStorageGet(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return tryLocalStorageGet(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  tryLocalStorageSet(ACCESS_TOKEN_KEY, accessToken);
  tryLocalStorageSet(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  tryLocalStorageRemove(ACCESS_TOKEN_KEY);
  tryLocalStorageRemove(REFRESH_TOKEN_KEY);
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

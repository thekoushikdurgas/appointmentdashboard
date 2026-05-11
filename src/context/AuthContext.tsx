"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  clearTokens,
  setTokens,
  isAuthenticated,
  getAccessToken,
} from "@/lib/tokenManager";
import { graphqlMutation, graphqlQuery } from "@/lib/graphqlClient";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/constants";
import type {
  GatewayGeolocationInput,
  GatewayUser,
} from "@/types/graphql-gateway";
import { normalizeGatewayRole } from "@/types/graphql-gateway";
import { authService } from "@/services/graphql/authService";
import type { GeolocationInput } from "@/graphql/generated/types";
import { AUTH_ME_QUERY, AUTH_LOGOUT_MUTATION } from "@/graphql/authOperations";
import { buildClientGeolocationHint } from "@/lib/authGeo";
import {
  readTTLCache,
  writeTTLCache,
  clearTTLCache,
} from "@/lib/ttlLocalStorageCache";

const ME_CACHE_KEY = "c360:auth:me:v1";
const ME_CACHE_TTL_MS = 5 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role?: UserRole;
  user_type?: string | null;
  is_verified?: boolean;
  subscription_plan?: string;
  credits_remaining?: number;
  /** From `me.profile` — drives General tab and header avatar. */
  job_title?: string | null;
  bio?: string | null;
  timezone?: string | null;
  avatar_url?: string | null;
}

export interface AuthLoginOptions {
  /** When true (default), sends best-effort `geolocation` on login for gateway audit. */
  attachClientGeo?: boolean;
  geolocation?: GeolocationInput | GatewayGeolocationInput | null;
}

export interface AuthRegisterOptions {
  geolocation?: GeolocationInput | GatewayGeolocationInput | null;
}

export interface TwoFactorChallenge {
  challengeToken: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  twoFactorChallenge: TwoFactorChallenge | null;
  login: (
    email: string,
    password: string,
    options?: AuthLoginOptions,
  ) => Promise<void>;
  completeTwoFactorLogin: (code: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    options?: AuthRegisterOptions,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: (forceRefetch?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type MeResponse = { auth: { me: GatewayUser | null } };

function mapGatewayUserToAuthUser(u: GatewayUser): AuthUser {
  const pr = u.profile;
  return {
    id: u.uuid,
    email: u.email,
    full_name: u.name ?? undefined,
    role: normalizeGatewayRole(pr?.role),
    user_type: null,
    subscription_plan: pr?.subscriptionPlan ?? undefined,
    credits_remaining: pr?.credits,
    job_title: pr?.jobTitle ?? null,
    bio: pr?.bio ?? null,
    timezone: pr?.timezone ?? null,
    avatar_url: pr?.avatarUrl ?? null,
  };
}

function mergeGeo(
  explicit: GeolocationInput | GatewayGeolocationInput | null | undefined,
  attachClient: boolean,
): GeolocationInput | undefined {
  if (explicit !== undefined && explicit !== null)
    return explicit as GeolocationInput;
  if (attachClient) return buildClientGeolocationHint();
  return undefined;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<TwoFactorChallenge | null>(null);
  const router = useRouter();

  const refreshUser = useCallback(async (forceRefetch = false) => {
    try {
      if (!isAuthenticated()) {
        setUser(null);
        clearTTLCache(ME_CACHE_KEY);
        return;
      }

      // FIX (Hypothesis A+B): Stale-while-revalidate.
      // Serve any cached entry (even if slightly stale) IMMEDIATELY so loading
      // resolves in <5ms, then fire a background network refresh to keep data fresh.
      const stale = readTTLCache<GatewayUser>(ME_CACHE_KEY);
      if (stale) {
        setUser(mapGatewayUserToAuthUser(stale));
        if (!forceRefetch) {
          return;
        }
        // forceRefetch=true: user already set from stale, refresh silently in background
      }

      const data = await graphqlQuery<MeResponse>(
        AUTH_ME_QUERY,
        {},
        { showToastOnError: false },
      );

      const me = data.auth?.me;
      if (me) {
        writeTTLCache(ME_CACHE_KEY, me, ME_CACHE_TTL_MS);
        setUser(mapGatewayUserToAuthUser(me));
      } else {
        clearTTLCache(ME_CACHE_KEY);
        setUser(null);
      }
    } catch {
      // On error: do NOT clear the user — stale user state is better than logged out.
      // Only clear if there is genuinely no token at all.
      if (!isAuthenticated()) setUser(null);
    }
  }, []);

  useEffect(() => {
    // FIX (Hypothesis A): If we have a valid token and any cached user, unblock
    // loading IMMEDIATELY (synchronously before the async refresh), so DashboardLayout
    // never shows a spinner on cold load with a valid session.
    if (isAuthenticated()) {
      const instant = readTTLCache<GatewayUser>(ME_CACHE_KEY);
      if (instant) {
        setUser(mapGatewayUserToAuthUser(instant));
        setLoading(false);
        // Still run a background refresh to keep data fresh — but loading is already false
        refreshUser(true).catch(() => undefined);
        return;
      }
    }

    refreshUser(false).finally(() => {
      setLoading(false);
    });
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string, options?: AuthLoginOptions) => {
      const attachClient = options?.attachClientGeo !== false;
      const geo = mergeGeo(options?.geolocation, attachClient);
      const result = await authService.login(
        { email, password },
        { geolocation: geo ?? null },
      );

      if (result.twoFactorRequired && result.challengeToken) {
        setTwoFactorChallenge({ challengeToken: result.challengeToken, email });
        router.push("/login/2fa");
        return;
      }

      // FIX (Hypothesis C): Write a seed GatewayUser to the TTL cache immediately
      // from the login payload. This means: (1) no cold-start 1465ms AUTH_ME_QUERY
      // on next page reload, (2) refreshUser(true) below finds stale data and serves
      // the user from cache instantly before firing its background network call.
      const seedGatewayUser: import("@/types/graphql-gateway").GatewayUser = {
        uuid: result.user.id,
        email: result.user.email,
        name: result.user.fullName ?? null,
        isActive: true,
        lastSignInAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: null,
        bucket: null,
        profile: null,
      };
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      writeTTLCache(ME_CACHE_KEY, seedGatewayUser, ME_CACHE_TTL_MS);
      setUser(mapGatewayUserToAuthUser(seedGatewayUser));
      // Background refresh to get full profile (credits, plan, etc.) — non-blocking
      refreshUser(true).catch(() => undefined);
      router.push(ROUTES.DASHBOARD);
    },
    [router, refreshUser],
  );

  const completeTwoFactorLogin = useCallback(
    async (code: string) => {
      if (!twoFactorChallenge) throw new Error("No active 2FA challenge.");
      const result = await authService.completeTwoFactorLogin(
        twoFactorChallenge.challengeToken,
        code,
      );
      setTwoFactorChallenge(null);
      const seed2FA: import("@/types/graphql-gateway").GatewayUser = {
        uuid: result.user.id,
        email: result.user.email,
        name: result.user.fullName ?? null,
        isActive: true,
        lastSignInAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: null,
        bucket: null,
        profile: null,
      };
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      writeTTLCache(ME_CACHE_KEY, seed2FA, ME_CACHE_TTL_MS);
      setUser(mapGatewayUserToAuthUser(seed2FA));
      refreshUser(true).catch(() => undefined);
      router.push(ROUTES.DASHBOARD);
    },
    [twoFactorChallenge, router, refreshUser],
  );

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      options?: AuthRegisterOptions,
    ) => {
      const result = await authService.register(
        { name, email, password },
        {
          geolocation:
            (options?.geolocation as GeolocationInput | null | undefined) ??
            buildClientGeolocationHint() ??
            null,
        },
      );
      const seedReg: import("@/types/graphql-gateway").GatewayUser = {
        uuid: result.user.id,
        email: result.user.email,
        name: result.user.fullName ?? null,
        isActive: true,
        lastSignInAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: null,
        bucket: null,
        profile: null,
      };
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      writeTTLCache(ME_CACHE_KEY, seedReg, ME_CACHE_TTL_MS);
      setUser(mapGatewayUserToAuthUser(seedReg));
      refreshUser(true).catch(() => undefined);
      router.push(ROUTES.DASHBOARD);
    },
    [router, refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await graphqlMutation<{ auth: { logout: boolean } }>(
          AUTH_LOGOUT_MUTATION,
          {},
          { showToastOnError: false },
        );
      }
    } catch {
      /* still clear local session */
    }
    clearTTLCache(ME_CACHE_KEY);
    clearTokens();
    setUser(null);
    toast.info("You have been signed out.");
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        twoFactorChallenge,
        login,
        completeTwoFactorLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

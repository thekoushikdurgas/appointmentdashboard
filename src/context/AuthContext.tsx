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

      if (!forceRefetch) {
        const cached = readTTLCache<GatewayUser>(ME_CACHE_KEY);
        if (cached) {
          setUser(mapGatewayUserToAuthUser(cached));
          return;
        }
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
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser(false).finally(() => setLoading(false));
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

      clearTTLCache(ME_CACHE_KEY);
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      setUser({
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.fullName,
        role: result.user.role,
        user_type: result.user.userType,
      });
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
      clearTTLCache(ME_CACHE_KEY);
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      setUser({
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.fullName,
        role: result.user.role,
        user_type: result.user.userType,
      });
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
      clearTTLCache(ME_CACHE_KEY);
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      setUser({
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.fullName,
        role: result.user.role,
        user_type: result.user.userType,
      });
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

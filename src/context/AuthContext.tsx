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
  GatewayPageSummary,
  GatewayUser,
} from "@/types/graphql-gateway";
import { normalizeGatewayRole } from "@/types/graphql-gateway";
import { pagesService } from "@/services/graphql/pagesService";
import { authService } from "@/services/graphql/authService";
import type { GeolocationInput } from "@/graphql/generated/types";
import { AUTH_ME_QUERY, AUTH_LOGOUT_MUTATION } from "@/graphql/authOperations";
import { buildClientGeolocationHint } from "@/lib/authGeo";
import { DEFAULT_AUTH_PAGE_TYPE } from "@/lib/authDefaults";
import { registerAuthPagesRefreshHandler } from "@/lib/authRefreshBridge";

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
  pageType?: string | null;
  /** When true (default), sends best-effort `geolocation` on login for gateway audit. */
  attachClientGeo?: boolean;
  geolocation?: GeolocationInput | GatewayGeolocationInput | null;
}

export interface AuthRegisterOptions {
  pageType?: string | null;
  geolocation?: GeolocationInput | GatewayGeolocationInput | null;
}

export interface TwoFactorChallenge {
  challengeToken: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessiblePages: GatewayPageSummary[];
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
  refreshUser: () => Promise<void>;
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
  const [accessiblePages, setAccessiblePages] = useState<GatewayPageSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<TwoFactorChallenge | null>(null);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      if (!isAuthenticated()) {
        setUser(null);
        setAccessiblePages([]);
        return;
      }
      const data = await graphqlQuery<MeResponse>(
        AUTH_ME_QUERY,
        {},
        { showToastOnError: false },
      );
      const me = data.auth?.me;
      if (me) {
        setUser(mapGatewayUserToAuthUser(me));
        try {
          const pagesData = await pagesService.getMyPages();
          setAccessiblePages(
            pagesData.pages.myPages.pages as GatewayPageSummary[],
          );
        } catch {
          /* keep existing pages */
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    registerAuthPagesRefreshHandler((pages) => setAccessiblePages(pages));
    return () => registerAuthPagesRefreshHandler(null);
  }, []);

  const login = async (
    email: string,
    password: string,
    options?: AuthLoginOptions,
  ) => {
    const attachClient = options?.attachClientGeo !== false;
    const geo = mergeGeo(options?.geolocation, attachClient);
    const result = await authService.login(
      { email, password },
      {
        pageType:
          options?.pageType !== undefined
            ? options.pageType
            : DEFAULT_AUTH_PAGE_TYPE,
        geolocation: geo ?? null,
      },
    );

    if (result.twoFactorRequired && result.challengeToken) {
      setTwoFactorChallenge({
        challengeToken: result.challengeToken,
        email,
      });
      router.push("/login/2fa");
      return;
    }

    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    setUser({
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.fullName,
      role: result.user.role,
      user_type: result.user.userType,
    });
    setAccessiblePages(result.pages);
    refreshUser().catch(() => undefined);
    router.push(ROUTES.DASHBOARD);
  };

  const completeTwoFactorLogin = async (code: string) => {
    if (!twoFactorChallenge) {
      throw new Error("No active 2FA challenge.");
    }
    const result = await authService.completeTwoFactorLogin(
      twoFactorChallenge.challengeToken,
      code,
    );
    setTwoFactorChallenge(null);
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    setUser({
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.fullName,
      role: result.user.role,
      user_type: result.user.userType,
    });
    setAccessiblePages(result.pages);
    refreshUser().catch(() => undefined);
    router.push(ROUTES.DASHBOARD);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    options?: AuthRegisterOptions,
  ) => {
    const result = await authService.register(
      { name, email, password },
      {
        pageType:
          options?.pageType !== undefined
            ? options.pageType
            : DEFAULT_AUTH_PAGE_TYPE,
        geolocation:
          (options?.geolocation as GeolocationInput | null | undefined) ??
          buildClientGeolocationHint() ??
          null,
      },
    );
    setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    setUser({
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.fullName,
      role: result.user.role,
      user_type: result.user.userType,
    });
    setAccessiblePages(result.pages);
    refreshUser().catch(() => undefined);
    router.push(ROUTES.DASHBOARD);
  };

  const logout = async () => {
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
    clearTokens();
    setUser(null);
    setAccessiblePages([]);
    toast.info("You have been signed out.");
    router.push(ROUTES.LOGIN);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessiblePages,
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

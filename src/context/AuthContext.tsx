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
import { consumePostLoginRoute } from "@/lib/returnRoute";

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
  job_title?: string | null;
  bio?: string | null;
  timezone?: string | null;
  avatar_url?: string | null;
}

export interface AuthLoginOptions {
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

export interface EmailVerificationChallenge {
  challengeToken: string;
  email: string;
}

export interface LoginOtpChallenge {
  challengeToken: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  twoFactorChallenge: TwoFactorChallenge | null;
  emailVerificationChallenge: EmailVerificationChallenge | null;
  loginOtpChallenge: LoginOtpChallenge | null;
  otpModalError: string | null;
  otpModalLoading: boolean;
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
  requestLoginOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (code: string) => Promise<void>;
  resendEmailOtp: () => Promise<void>;
  dismissEmailOtp: () => void;
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

function seedGatewayUserFromAuth(user: {
  id: string;
  email: string;
  fullName: string;
}): GatewayUser {
  return {
    uuid: user.id,
    email: user.email,
    name: user.fullName ?? null,
    isActive: true,
    lastSignInAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: null,
    bucket: null,
    profile: null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<TwoFactorChallenge | null>(null);
  const [emailVerificationChallenge, setEmailVerificationChallenge] =
    useState<EmailVerificationChallenge | null>(null);
  const [loginOtpChallenge, setLoginOtpChallenge] =
    useState<LoginOtpChallenge | null>(null);
  const [otpModalError, setOtpModalError] = useState<string | null>(null);
  const [otpModalLoading, setOtpModalLoading] = useState(false);
  const router = useRouter();

  const navigateAfterAuth = useCallback(() => {
    router.push(consumePostLoginRoute());
  }, [router]);

  const refreshUser = useCallback(async (forceRefetch = false) => {
    try {
      if (!isAuthenticated()) {
        setUser(null);
        clearTTLCache(ME_CACHE_KEY);
        return;
      }

      const stale = readTTLCache<GatewayUser>(ME_CACHE_KEY);
      if (stale) {
        setUser(mapGatewayUserToAuthUser(stale));
        if (!forceRefetch) {
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
      if (!isAuthenticated()) setUser(null);
    }
  }, []);

  const finishAuthSession = useCallback(
    (result: {
      tokens: { accessToken: string; refreshToken: string };
      user: { id: string; email: string; fullName: string };
    }) => {
      const seed = seedGatewayUserFromAuth(result.user);
      setTokens(result.tokens.accessToken, result.tokens.refreshToken);
      writeTTLCache(ME_CACHE_KEY, seed, ME_CACHE_TTL_MS);
      setUser(mapGatewayUserToAuthUser(seed));
      refreshUser(true).catch(() => undefined);
      navigateAfterAuth();
    },
    [navigateAfterAuth, refreshUser],
  );

  useEffect(() => {
    if (isAuthenticated()) {
      const instant = readTTLCache<GatewayUser>(ME_CACHE_KEY);
      if (instant) {
        setUser(mapGatewayUserToAuthUser(instant));
        setLoading(false);
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

      finishAuthSession(result);
    },
    [router, finishAuthSession],
  );

  const completeTwoFactorLogin = useCallback(
    async (code: string) => {
      if (!twoFactorChallenge) throw new Error("No active 2FA challenge.");
      const result = await authService.completeTwoFactorLogin(
        twoFactorChallenge.challengeToken,
        code,
      );
      setTwoFactorChallenge(null);
      finishAuthSession(result);
    },
    [twoFactorChallenge, finishAuthSession],
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

      if (
        result.emailVerificationRequired &&
        result.verificationChallengeToken
      ) {
        setEmailVerificationChallenge({
          challengeToken: result.verificationChallengeToken,
          email,
        });
        setOtpModalError(null);
        return;
      }

      finishAuthSession(result);
    },
    [finishAuthSession],
  );

  const requestLoginOtp = useCallback(async (email: string) => {
    setOtpModalError(null);
    const payload = await authService.requestLoginOtp(email);
    if (payload.challengeToken && payload.email) {
      setLoginOtpChallenge({
        challengeToken: payload.challengeToken,
        email: payload.email,
      });
      return;
    }
    toast.success(
      "If an account exists for that email, a sign-in code has been sent.",
    );
  }, []);

  const verifyEmailOtp = useCallback(
    async (code: string) => {
      setOtpModalLoading(true);
      setOtpModalError(null);
      try {
        if (emailVerificationChallenge) {
          const result = await authService.verifyRegistrationOtp(
            emailVerificationChallenge.challengeToken,
            code,
          );
          setEmailVerificationChallenge(null);
          finishAuthSession(result);
          return;
        }
        if (loginOtpChallenge) {
          const result = await authService.completeLoginOtp(
            loginOtpChallenge.challengeToken,
            code,
          );
          setLoginOtpChallenge(null);
          finishAuthSession(result);
          return;
        }
        throw new Error("No active verification challenge.");
      } catch (err) {
        setOtpModalError(
          err instanceof Error ? err.message : "Invalid verification code.",
        );
        throw err;
      } finally {
        setOtpModalLoading(false);
      }
    },
    [emailVerificationChallenge, loginOtpChallenge, finishAuthSession],
  );

  const resendEmailOtp = useCallback(async () => {
    setOtpModalError(null);
    try {
      if (emailVerificationChallenge) {
        await authService.resendRegistrationOtp(
          emailVerificationChallenge.challengeToken,
        );
        toast.success("Verification code sent.");
        return;
      }
      if (loginOtpChallenge) {
        await authService.resendLoginOtp(loginOtpChallenge.challengeToken);
        toast.success("Sign-in code sent.");
        return;
      }
    } catch (err) {
      setOtpModalError(
        err instanceof Error ? err.message : "Could not resend code.",
      );
      throw err;
    }
  }, [emailVerificationChallenge, loginOtpChallenge]);

  const dismissEmailOtp = useCallback(() => {
    setEmailVerificationChallenge(null);
    setLoginOtpChallenge(null);
    setOtpModalError(null);
  }, []);

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
        emailVerificationChallenge,
        loginOtpChallenge,
        otpModalError,
        otpModalLoading,
        login,
        completeTwoFactorLogin,
        register,
        requestLoginOtp,
        verifyEmailOtp,
        resendEmailOtp,
        dismissEmailOtp,
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

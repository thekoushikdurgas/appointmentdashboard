import { graphqlMutation } from "@/lib/graphqlClient";
import type { GeolocationInput } from "@/graphql/generated/types";
import type {
  GatewayAuthPayload,
  GatewayUserInfo,
} from "@/types/graphql-gateway";
import { normalizeGatewayRole } from "@/types/graphql-gateway";
import type { UserRole } from "@/lib/constants";
import {
  AUTH_LOGIN_MUTATION,
  AUTH_REGISTER_MUTATION,
  AUTH_LOGOUT_MUTATION,
  AUTH_COMPLETE_TWO_FACTOR_MUTATION,
  AUTH_REQUEST_PASSWORD_RESET_MUTATION,
  AUTH_RESET_PASSWORD_MUTATION,
} from "@/graphql/authOperations";
import { DEFAULT_AUTH_PAGE_TYPE } from "@/lib/authDefaults";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthRegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthMutationOptions {
  /** When set, filters `pages` in the payload per gateway (docs | marketing | dashboard). */
  pageType?: string | null;
  geolocation?: GeolocationInput | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserBasic {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  userType: string | null;
}

interface LoginResult {
  auth: { login: GatewayAuthPayload };
}
interface RegisterResult {
  auth: { register: GatewayAuthPayload };
}
interface LogoutResult {
  auth: { logout: boolean };
}

function mapUserInfo(u: GatewayUserInfo): UserBasic {
  return {
    id: u.uuid,
    email: u.email,
    fullName: u.name ?? "",
    role: normalizeGatewayRole(u.role),
    userType: u.userType ?? null,
  };
}

function variablesForAuthMutations(pageType?: string | null): {
  pageType: string | null;
} {
  const pt = pageType === undefined ? DEFAULT_AUTH_PAGE_TYPE : pageType;
  return { pageType: pt };
}

export const authService = {
  login: async (input: AuthCredentials, options?: AuthMutationOptions) => {
    const geo = options?.geolocation ?? undefined;
    const variables = {
      input: {
        email: input.email,
        password: input.password,
        ...(geo ? { geolocation: geo } : {}),
      },
      ...variablesForAuthMutations(options?.pageType),
    };
    const data = await graphqlMutation<LoginResult>(
      AUTH_LOGIN_MUTATION,
      variables,
      { skipAuth: true, showToastOnError: true },
    );
    const {
      accessToken,
      refreshToken,
      user,
      pages,
      twoFactorRequired,
      challengeToken,
    } = data.auth.login;
    return {
      tokens: { accessToken, refreshToken },
      user: mapUserInfo(user),
      pages: pages ?? [],
      twoFactorRequired: twoFactorRequired ?? false,
      challengeToken: challengeToken ?? null,
    };
  },

  completeTwoFactorLogin: async (
    challengeToken: string,
    code: string,
    options?: AuthMutationOptions,
  ) => {
    const data = await graphqlMutation<{
      auth: { completeTwoFactorLogin: GatewayAuthPayload };
    }>(
      AUTH_COMPLETE_TWO_FACTOR_MUTATION,
      {
        input: { challengeToken, code },
        ...variablesForAuthMutations(options?.pageType),
      },
      { skipAuth: true, showToastOnError: false },
    );
    const { accessToken, refreshToken, user, pages } =
      data.auth.completeTwoFactorLogin;
    return {
      tokens: { accessToken, refreshToken },
      user: mapUserInfo(user),
      pages: pages ?? [],
    };
  },

  register: async (
    input: AuthRegisterCredentials,
    options?: AuthMutationOptions,
  ) => {
    const geo = options?.geolocation ?? undefined;
    const variables = {
      input: {
        name: input.name,
        email: input.email,
        password: input.password,
        ...(geo ? { geolocation: geo } : {}),
      },
      ...variablesForAuthMutations(options?.pageType),
    };
    const data = await graphqlMutation<RegisterResult>(
      AUTH_REGISTER_MUTATION,
      variables,
      { skipAuth: true, showToastOnError: true },
    );
    const { accessToken, refreshToken, user, pages } = data.auth.register;
    return {
      tokens: { accessToken, refreshToken },
      user: mapUserInfo(user),
      pages: pages ?? [],
    };
  },

  logout: () => graphqlMutation<LogoutResult>(AUTH_LOGOUT_MUTATION, {}, {}),

  requestPasswordReset: async (email: string): Promise<boolean> => {
    const data = await graphqlMutation<{
      auth: { requestPasswordReset: boolean };
    }>(
      AUTH_REQUEST_PASSWORD_RESET_MUTATION,
      { input: { email } },
      { skipAuth: true, showToastOnError: false },
    );
    return data.auth.requestPasswordReset;
  },

  resetPassword: async (
    email: string,
    token: string,
    newPassword: string,
  ): Promise<boolean> => {
    const data = await graphqlMutation<{
      auth: { resetPassword: boolean };
    }>(
      AUTH_RESET_PASSWORD_MUTATION,
      { input: { email, token, newPassword } },
      { skipAuth: true, showToastOnError: false },
    );
    return data.auth.resetPassword;
  },
};

export type { GeolocationInput };

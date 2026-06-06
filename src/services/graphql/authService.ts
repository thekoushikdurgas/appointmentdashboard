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
  AUTH_VERIFY_REGISTRATION_OTP_MUTATION,
  AUTH_RESEND_REGISTRATION_OTP_MUTATION,
  AUTH_REQUEST_LOGIN_OTP_MUTATION,
  AUTH_COMPLETE_LOGIN_OTP_MUTATION,
  AUTH_RESEND_LOGIN_OTP_MUTATION,
} from "@/graphql/authOperations";

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

function mapAuthPayload(payload: GatewayAuthPayload) {
  const {
    accessToken,
    refreshToken,
    user,
    twoFactorRequired,
    challengeToken,
    emailVerificationRequired,
    verificationChallengeToken,
  } = payload;
  return {
    tokens: { accessToken, refreshToken },
    user: mapUserInfo(user),
    twoFactorRequired: twoFactorRequired ?? false,
    challengeToken: challengeToken ?? null,
    emailVerificationRequired: emailVerificationRequired ?? false,
    verificationChallengeToken: verificationChallengeToken ?? null,
  };
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

export const authService = {
  login: async (input: AuthCredentials, options?: AuthMutationOptions) => {
    const geo = options?.geolocation ?? undefined;
    const variables = {
      input: {
        email: input.email,
        password: input.password,
        ...(geo ? { geolocation: geo } : {}),
      },
    };
    const data = await graphqlMutation<LoginResult>(
      AUTH_LOGIN_MUTATION,
      variables,
      { skipAuth: true, showToastOnError: true },
    );
    return mapAuthPayload(data.auth.login);
  },

  completeTwoFactorLogin: async (
    challengeToken: string,
    code: string,
    _options?: AuthMutationOptions,
  ) => {
    const data = await graphqlMutation<{
      auth: { completeTwoFactorLogin: GatewayAuthPayload };
    }>(
      AUTH_COMPLETE_TWO_FACTOR_MUTATION,
      {
        input: { challengeToken, code },
      },
      { skipAuth: true, showToastOnError: false },
    );
    const { accessToken, refreshToken, user } =
      data.auth.completeTwoFactorLogin;
    return {
      tokens: { accessToken, refreshToken },
      user: mapUserInfo(user),
    };
  },

  verifyRegistrationOtp: async (challengeToken: string, code: string) => {
    const data = await graphqlMutation<{
      auth: { verifyRegistrationOtp: GatewayAuthPayload };
    }>(
      AUTH_VERIFY_REGISTRATION_OTP_MUTATION,
      { input: { challengeToken, code } },
      { skipAuth: true, showToastOnError: false },
    );
    return mapAuthPayload(data.auth.verifyRegistrationOtp);
  },

  resendRegistrationOtp: async (challengeToken: string): Promise<boolean> => {
    const data = await graphqlMutation<{
      auth: { resendRegistrationOtp: boolean };
    }>(
      AUTH_RESEND_REGISTRATION_OTP_MUTATION,
      { input: { challengeToken } },
      { skipAuth: true, showToastOnError: false },
    );
    return data.auth.resendRegistrationOtp;
  },

  requestLoginOtp: async (email: string) => {
    const data = await graphqlMutation<{
      auth: {
        requestLoginOtp: {
          success: boolean;
          challengeToken: string | null;
          email: string | null;
        };
      };
    }>(
      AUTH_REQUEST_LOGIN_OTP_MUTATION,
      { input: { email } },
      { skipAuth: true, showToastOnError: true },
    );
    return data.auth.requestLoginOtp;
  },

  completeLoginOtp: async (challengeToken: string, code: string) => {
    const data = await graphqlMutation<{
      auth: { completeLoginOtp: GatewayAuthPayload };
    }>(
      AUTH_COMPLETE_LOGIN_OTP_MUTATION,
      { input: { challengeToken, code } },
      { skipAuth: true, showToastOnError: false },
    );
    return mapAuthPayload(data.auth.completeLoginOtp);
  },

  resendLoginOtp: async (challengeToken: string): Promise<boolean> => {
    const data = await graphqlMutation<{
      auth: { resendLoginOtp: boolean };
    }>(
      AUTH_RESEND_LOGIN_OTP_MUTATION,
      { input: { challengeToken } },
      { skipAuth: true, showToastOnError: false },
    );
    return data.auth.resendLoginOtp;
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
    };
    const data = await graphqlMutation<RegisterResult>(
      AUTH_REGISTER_MUTATION,
      variables,
      { skipAuth: true, showToastOnError: true },
    );
    return mapAuthPayload(data.auth.register);
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

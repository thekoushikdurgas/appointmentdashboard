/**
 * Single source of truth for auth GraphQL documents.
 * Variable shapes match `AuthMutation*` args in `graphql/generated/types.ts`.
 */
import { AUTH_PAYLOAD_USER_FIELDS } from "@/graphql/authSelections";
import { USERS_PROFILE_FIELDS } from "@/graphql/usersOperations";

const AUTH_PAYLOAD_BODY = `
  accessToken
  refreshToken
  user { ${AUTH_PAYLOAD_USER_FIELDS} }
  twoFactorRequired
  challengeToken
  emailVerificationRequired
  verificationChallengeToken
`;

export const AUTH_LOGIN_MUTATION = `
  mutation AuthLogin($input: LoginInput!) {
    auth {
      login(input: $input) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

/** @see AuthMutationRegisterArgs */
export const AUTH_REGISTER_MUTATION = `
  mutation AuthRegister($input: RegisterInput!) {
    auth {
      register(input: $input) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

/** @see AuthMutationRefreshTokenArgs */
export const AUTH_REFRESH_MUTATION = `
  mutation AuthRefreshToken($input: RefreshTokenInput!) {
    auth {
      refreshToken(input: $input) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

export const AUTH_LOGOUT_MUTATION = `
  mutation AuthLogout {
    auth {
      logout
    }
  }
`;

export const AUTH_ME_QUERY = `
  query AuthMe {
    auth {
      me {
        uuid
        email
        name
        isActive
        lastSignInAt
        createdAt
        updatedAt
        bucket
        profile {
          ${USERS_PROFILE_FIELDS}
        }
      }
    }
  }
`;

/** Requires Bearer; errors when anonymous — @see AuthQuery.session */
export const AUTH_SESSION_QUERY = `
  query AuthSession {
    auth {
      session {
        userUuid
        email
        isAuthenticated
        lastSignInAt
      }
    }
  }
`;

export const AUTH_COMPLETE_TWO_FACTOR_MUTATION = `
  mutation AuthCompleteTwoFactor($input: CompleteTwoFactorLoginInput!) {
    auth {
      completeTwoFactorLogin(input: $input) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

export const AUTH_REQUEST_PASSWORD_RESET_MUTATION = `
  mutation AuthRequestPasswordReset($input: RequestPasswordResetInput!) {
    auth {
      requestPasswordReset(input: $input)
    }
  }
`;

export const AUTH_RESET_PASSWORD_MUTATION = `
  mutation AuthResetPassword($input: ResetPasswordInput!) {
    auth {
      resetPassword(input: $input)
    }
  }
`;

export const AUTH_VERIFY_REGISTRATION_OTP_MUTATION = `
  mutation AuthVerifyRegistrationOtp($input: VerifyRegistrationOtpInput!) {
    auth {
      verifyRegistrationOtp(input: $input) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

export const AUTH_RESEND_REGISTRATION_OTP_MUTATION = `
  mutation AuthResendRegistrationOtp($input: ResendRegistrationOtpInput!) {
    auth {
      resendRegistrationOtp(input: $input)
    }
  }
`;

export const AUTH_REQUEST_LOGIN_OTP_MUTATION = `
  mutation AuthRequestLoginOtp($input: RequestLoginOtpInput!) {
    auth {
      requestLoginOtp(input: $input) {
        success
        challengeToken
        email
      }
    }
  }
`;

export const AUTH_COMPLETE_LOGIN_OTP_MUTATION = `
  mutation AuthCompleteLoginOtp($input: CompleteLoginOtpInput!) {
    auth {
      completeLoginOtp(input: $input) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

export const AUTH_RESEND_LOGIN_OTP_MUTATION = `
  mutation AuthResendLoginOtp($input: ResendLoginOtpInput!) {
    auth {
      resendLoginOtp(input: $input)
    }
  }
`;

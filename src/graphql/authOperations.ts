/**
 * Single source of truth for auth GraphQL documents.
 * Variable shapes match `AuthMutation*` args in `graphql/generated/types.ts`
 * (`pageType` optional on login / register / refreshToken).
 */
import { AUTH_PAYLOAD_USER_FIELDS } from "@/graphql/authSelections";
import { USERS_PROFILE_FIELDS } from "@/graphql/usersOperations";

export const AUTH_PAGE_SUMMARY_FIELDS = `
  pageId
  title
  pageType
  route
  status
`;

const AUTH_PAYLOAD_BODY = `
  accessToken
  refreshToken
  user { ${AUTH_PAYLOAD_USER_FIELDS} }
  pages { ${AUTH_PAGE_SUMMARY_FIELDS} }
  twoFactorRequired
  challengeToken
`;

/** @see AuthMutationLoginArgs — `$pageType` filters DocsAI pages when set. */
export const AUTH_LOGIN_MUTATION = `
  mutation AuthLogin($input: LoginInput!, $pageType: String) {
    auth {
      login(input: $input, pageType: $pageType) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

/** @see AuthMutationRegisterArgs */
export const AUTH_REGISTER_MUTATION = `
  mutation AuthRegister($input: RegisterInput!, $pageType: String) {
    auth {
      register(input: $input, pageType: $pageType) {
        ${AUTH_PAYLOAD_BODY}
      }
    }
  }
`;

/** @see AuthMutationRefreshTokenArgs */
export const AUTH_REFRESH_MUTATION = `
  mutation AuthRefreshToken($input: RefreshTokenInput!, $pageType: String) {
    auth {
      refreshToken(input: $input, pageType: $pageType) {
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
  mutation AuthCompleteTwoFactor($input: CompleteTwoFactorLoginInput!, $pageType: String) {
    auth {
      completeTwoFactorLogin(input: $input, pageType: $pageType) {
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

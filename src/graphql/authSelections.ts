/**
 * GraphQL field selections aligned with the gateway `UserInfo` type
 * (`contact360.io/api/app/graphql/modules/auth/types.py`).
 *
 * Do not add profile/billing fields here — `UserInfo` only exposes:
 * uuid, email, name, role, userType. Plan, credits, and verification
 * belong on `auth { me { profile { ... } } }` (User + UserProfile).
 */
export const AUTH_PAYLOAD_USER_FIELDS = `
  uuid
  email
  name
  role
  userType
` as const;

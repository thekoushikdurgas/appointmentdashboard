/**
 * GraphQL documents for `query.users` / `mutation.users`.
 * Variable shapes match `UserQuery*` / `UserMutation*` in `graphql/generated/types.ts`.
 */

/** `UserProfile` selection — keep in sync with `authOperations` `me.profile` and `usersService` ME. */
export const USERS_PROFILE_FIELDS = `
  userId
  jobTitle
  bio
  timezone
  role
  credits
  subscriptionPlan
  subscriptionPeriod
  subscriptionStatus
  subscriptionStartedAt
  subscriptionEndsAt
  createdAt
  updatedAt
  avatarUrl
` as const;

const USER_WITH_PROFILE_BODY = `
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
`;

/** @see UserMutationUpdateUserArgs */
export const USERS_UPDATE_USER_MUTATION = `
  mutation UsersUpdateUser($input: UpdateUserInput!) {
    users {
      updateUser(input: $input) {
        ${USER_WITH_PROFILE_BODY}
      }
    }
  }
`;

/** @see UserQueryUserArgs */
export const USERS_GET_USER_QUERY = `
  query UsersGetUser($uuid: ID!) {
    users {
      user(uuid: $uuid) {
        ${USER_WITH_PROFILE_BODY}
      }
    }
  }
`;

/** @see UserQueryUsersArgs */
export const USERS_LIST_QUERY = `
  query UsersList($limit: Int, $offset: Int) {
    users {
      users(limit: $limit, offset: $offset) {
        ${USER_WITH_PROFILE_BODY}
      }
    }
  }
`;

/** @see UserQuery — `userStats` (list-based; distinct from `admin.userStats` JSON maps). */
export const USERS_USER_STATS_QUERY = `
  query UsersUserStats {
    users {
      userStats {
        totalUsers
        activeUsers
        inactiveUsers
        usersByRole {
          role
          count
        }
        usersBySubscription {
          subscriptionPlan
          count
        }
      }
    }
  }
`;

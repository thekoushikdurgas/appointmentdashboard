import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type { GatewayUserProfile } from "@/types/graphql-gateway";
import type {
  UpdateProfileInput,
  UpdateUserInput,
  UploadAvatarInput,
  UserFilterInput,
  UserStats,
} from "@/graphql/generated/types";
import {
  USERS_PROFILE_FIELDS,
  USERS_UPDATE_USER_MUTATION,
  USERS_GET_USER_QUERY,
  USERS_LIST_QUERY,
  USERS_USER_STATS_QUERY,
} from "@/graphql/usersOperations";

/** App-facing profile row (mirrors gateway UserProfile + user id). */
export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  bio: string | null;
  timezone: string | null;
  role: string | null;
  credits: number;
  subscriptionPlan: string | null;
  subscriptionPeriod: string | null;
  subscriptionStatus: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  avatarUrl: string | null;
}

const ME = `query UsersMe {
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
}`;

const UPDATE_PROFILE = `
  mutation UpdateGatewayProfile($input: UpdateProfileInput!) {
    users {
      updateProfile(input: $input) {
        ${USERS_PROFILE_FIELDS}
      }
    }
  }
`;

type MeRow = NonNullable<
  {
    auth: { me: GatewayMe };
  }["auth"]["me"]
>;

interface GatewayMe {
  uuid: string;
  email: string;
  name: string | null;
  isActive: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  bucket: string | null;
  profile: {
    userId: string;
    jobTitle: string | null;
    bio: string | null;
    timezone: string | null;
    role: string | null;
    credits: number;
    subscriptionPlan: string | null;
    subscriptionPeriod: string | null;
    subscriptionStatus: string | null;
    subscriptionStartedAt: string | null;
    subscriptionEndsAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    avatarUrl: string | null;
  } | null;
}

function toUserProfile(me: MeRow): UserProfile {
  const pr = me.profile;
  return {
    id: me.uuid,
    userId: pr?.userId ?? me.uuid,
    email: me.email,
    fullName: me.name,
    jobTitle: pr?.jobTitle ?? null,
    bio: pr?.bio ?? null,
    timezone: pr?.timezone ?? null,
    role: pr?.role ?? null,
    credits: pr?.credits ?? 0,
    subscriptionPlan: pr?.subscriptionPlan ?? null,
    subscriptionPeriod: pr?.subscriptionPeriod ?? null,
    subscriptionStatus: pr?.subscriptionStatus ?? null,
    subscriptionStartedAt: pr?.subscriptionStartedAt ?? null,
    subscriptionEndsAt: pr?.subscriptionEndsAt ?? null,
    createdAt: pr?.createdAt ?? me.createdAt,
    updatedAt: pr?.updatedAt ?? me.updatedAt,
    avatarUrl: pr?.avatarUrl ?? null,
  };
}

const GET_USER = `query AdminGetUser($uuid: ID!) {
  admin {
    user(uuid: $uuid) {
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
}`;

const LIST_USERS = `query AdminListUsers($filters: UserFilterInput) {
  admin {
    users(filters: $filters) {
      items {
        uuid
        email
        name
        isActive
        lastSignInAt
        createdAt
        updatedAt
        profile {
          role
          credits
          subscriptionPlan
          avatarUrl
        }
      }
      pageInfo {
        total
        limit
        offset
        hasNext
        hasPrevious
      }
    }
  }
}`;

const GET_USER_STATS = `query AdminUserStats {
  admin {
    userStats {
      totalUsers
      activeUsers
      usersByRole
      usersByPlan
    }
  }
}`;

const UPLOAD_AVATAR = `mutation UploadAvatar($input: UploadAvatarInput!) {
  users {
    uploadAvatar(input: $input) {
      ${USERS_PROFILE_FIELDS}
    }
  }
}`;

export const usersService = {
  me: async () => {
    const data = await graphqlQuery<{ auth: { me: GatewayMe | null } }>(ME);
    const me = data.auth?.me;
    if (!me) return { user: { me: null as UserProfile | null } };
    return { user: { me: toUserProfile(me) } };
  },

  updateProfile: async (input: UpdateProfileInput) => {
    const data = await graphqlMutation<{
      users: { updateProfile: GatewayUserProfile };
    }>(UPDATE_PROFILE, { input });
    return { user: { updateProfile: data.users.updateProfile } };
  },

  /** @see `UserMutation.updateUser` — `name` / `email` (optional). */
  updateUser: async (input: UpdateUserInput) => {
    const data = await graphqlMutation<{ users: { updateUser: GatewayMe } }>(
      USERS_UPDATE_USER_MUTATION,
      { input },
    );
    return { users: { updateUser: data.users.updateUser } };
  },

  getUser: (uuid: string) =>
    graphqlQuery<{ admin: { user: GatewayMe } }>(GET_USER, { uuid }),

  listUsers: async (opts?: { limit?: number; offset?: number }) => {
    const filters: UserFilterInput = {
      limit: opts?.limit ?? 25,
      offset: opts?.offset ?? 0,
    };
    const data = await graphqlQuery<{
      admin: {
        users: {
          items: Array<{
            uuid: string;
            email: string;
            name: string | null;
            isActive: boolean;
            lastSignInAt: string | null;
            createdAt: string;
            updatedAt: string | null;
            profile: {
              role: string | null;
              credits: number;
              subscriptionPlan: string | null;
              avatarUrl: string | null;
            } | null;
          }>;
          pageInfo: {
            total: number;
            limit: number;
            offset: number;
            hasNext: boolean;
            hasPrevious: boolean;
          };
        };
      };
    }>(LIST_USERS, { filters });
    return data.admin.users;
  },

  getUserStats: () =>
    graphqlQuery<{
      admin: {
        userStats: {
          totalUsers: number;
          activeUsers: number;
          usersByRole: Record<string, number>;
          usersByPlan: Record<string, number>;
        };
      };
    }>(GET_USER_STATS),

  uploadAvatar: (input: UploadAvatarInput) =>
    graphqlMutation<{ users: { uploadAvatar: GatewayUserProfile } }>(
      UPLOAD_AVATAR,
      { input },
    ),

  /** `users.user` — same `User` shape as `auth.me` when caller is permitted. */
  getUserByUuid: (uuid: string) =>
    graphqlQuery<{ users: { user: GatewayMe } }>(USERS_GET_USER_QUERY, {
      uuid,
    }),

  /** `users.users` — admin/super-admin list per Users module doc. */
  listUsersNamespace: (limit?: number, offset?: number) =>
    graphqlQuery<{ users: { users: GatewayMe[] } }>(USERS_LIST_QUERY, {
      limit: limit ?? 100,
      offset: offset ?? 0,
    }),

  /** `users.userStats` — list-based stats (not `admin.userStats` JSON maps). */
  getUsersNamespaceUserStats: () =>
    graphqlQuery<{ users: { userStats: UserStats } }>(USERS_USER_STATS_QUERY),
};

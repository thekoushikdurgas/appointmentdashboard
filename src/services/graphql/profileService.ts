import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type { CreateApiKeyInput } from "@/graphql/generated/types";

export type { CreateApiKeyInput };

const API_KEYS = `query ProfileApiKeys {
  profile {
    listAPIKeys {
      total
      keys {
        id
        name
        prefix
        createdAt
        lastUsedAt
        readAccess
        writeAccess
        expiresAt
      }
    }
  }
}`;

const CREATE_API_KEY = `mutation ProfileCreateApiKey($input: CreateApiKeyInput!) {
  profile {
    createAPIKey(input: $input) {
      id
      name
      prefix
      key
      createdAt
      lastUsedAt
      readAccess
      writeAccess
      expiresAt
    }
  }
}`;

const DELETE_API_KEY = `mutation ProfileDeleteApiKey($id: ID!) {
  profile {
    deleteAPIKey(id: $id)
  }
}`;

const SESSIONS = `query ProfileSessions {
  profile {
    listSessions {
      total
      sessions {
        id
        userAgent
        ipAddress
        createdAt
        lastActivity
        isCurrent
      }
    }
  }
}`;

const REVOKE_SESSION = `mutation ProfileRevokeSession($id: ID!) {
  profile {
    revokeSession(id: $id)
  }
}`;

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  readAccess: boolean;
  writeAccess: boolean;
  expiresAt: string | null;
}

export interface SessionRow {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

export interface TeamMemberRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  invitedAt: string;
  joinedAt: string | null;
  status: string;
}

const LIST_TEAM_MEMBERS = `query ProfileTeamMembers {
  profile {
    listTeamMembers {
      total
      members {
        id
        email
        name
        role
        invitedAt
        joinedAt
        status
      }
    }
  }
}`;

const INVITE_TEAM_MEMBER = `mutation ProfileInviteTeamMember($input: InviteTeamMemberInput!) {
  profile {
    inviteTeamMember(input: $input) {
      id
      email
      name
      role
      invitedAt
      joinedAt
      status
    }
  }
}`;

const UPDATE_TEAM_MEMBER_ROLE = `mutation ProfileUpdateTeamMemberRole($id: ID!, $role: String!) {
  profile {
    updateTeamMemberRole(id: $id, role: $role) {
      id
      email
      role
      status
    }
  }
}`;

const REMOVE_TEAM_MEMBER = `mutation ProfileRemoveTeamMember($id: ID!) {
  profile {
    removeTeamMember(id: $id)
  }
}`;

const REVOKE_ALL_OTHER_SESSIONS = `mutation ProfileRevokeAllOtherSessions {
  profile {
    revokeAllOtherSessions
  }
}`;

export const profileService = {
  getApiKeys: async () => {
    const data = await graphqlQuery<{
      profile: { listAPIKeys: { keys: ApiKeyRow[]; total: number } };
    }>(API_KEYS);
    return {
      keys: data.profile.listAPIKeys.keys,
      total: data.profile.listAPIKeys.total,
    };
  },

  createApiKey: (input: CreateApiKeyInput) =>
    graphqlMutation<{
      profile: { createAPIKey: ApiKeyRow & { key: string | null } };
    }>(CREATE_API_KEY, { input }),

  deleteApiKey: (id: string) =>
    graphqlMutation<{ profile: { deleteAPIKey: boolean } }>(DELETE_API_KEY, {
      id,
    }),

  getSessions: async () => {
    const data = await graphqlQuery<{
      profile: { listSessions: { sessions: SessionRow[]; total: number } };
    }>(SESSIONS);
    return {
      sessions: data.profile.listSessions.sessions,
      total: data.profile.listSessions.total,
    };
  },

  revokeSession: (id: string) =>
    graphqlMutation<{ profile: { revokeSession: boolean } }>(REVOKE_SESSION, {
      id,
    }),

  revokeAllOtherSessions: () =>
    graphqlMutation<{ profile: { revokeAllOtherSessions: boolean } }>(
      REVOKE_ALL_OTHER_SESSIONS,
      {},
    ),

  listTeamMembers: async () => {
    const data = await graphqlQuery<{
      profile: { listTeamMembers: { members: TeamMemberRow[]; total: number } };
    }>(LIST_TEAM_MEMBERS);
    return {
      members: data.profile.listTeamMembers.members,
      total: data.profile.listTeamMembers.total,
    };
  },

  /** `InviteTeamMemberInput` is email + role only on the gateway. */
  inviteTeamMember: (input: { email: string; role?: string }) =>
    graphqlMutation<{ profile: { inviteTeamMember: TeamMemberRow } }>(
      INVITE_TEAM_MEMBER,
      {
        input: {
          email: input.email,
          role: input.role ?? "Member",
        },
      },
    ),

  updateTeamMemberRole: (id: string, role: string) =>
    graphqlMutation<{ profile: { updateTeamMemberRole: TeamMemberRow } }>(
      UPDATE_TEAM_MEMBER_ROLE,
      { id, role },
    ),

  removeTeamMember: (id: string) =>
    graphqlMutation<{ profile: { removeTeamMember: boolean } }>(
      REMOVE_TEAM_MEMBER,
      { id },
    ),
};

/** @deprecated Use profileService.createApiKey — gateway has no regenerate. */
export const regenerateApiKey = () =>
  Promise.reject(
    new Error("regenerateApiKey removed: use profileService.createApiKey"),
  );

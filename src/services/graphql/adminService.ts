import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import type {
  AdminUserStats,
  LogEntry,
  LogConnection,
  LogStatistics,
  UserHistoryConnection,
  UserHistoryItem,
  PageInfo,
} from "@/graphql/generated/types";
import {
  ADMIN_USER_STATS_QUERY,
  ADMIN_USERS_QUERY,
  ADMIN_USERS_WITH_BUCKETS_QUERY,
  ADMIN_LOG_STATISTICS_QUERY,
  ADMIN_LOGS_QUERY,
  ADMIN_SEARCH_LOGS_QUERY,
  ADMIN_USER_HISTORY_QUERY,
  ADMIN_UPDATE_USER_ROLE_MUTATION,
  ADMIN_UPDATE_USER_CREDITS_MUTATION,
  ADMIN_DELETE_USER_MUTATION,
  ADMIN_PROMOTE_TO_ADMIN_MUTATION,
  ADMIN_PROMOTE_TO_SUPER_ADMIN_MUTATION,
} from "@/graphql/adminOperations";

export type {
  AdminUserStats,
  LogEntry,
  LogConnection,
  LogStatistics,
  UserHistoryItem,
  UserHistoryConnection,
};

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  plan: string;
  credits: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  bucket?: string | null;
}

/** @deprecated Use `AdminUserRow` */
export type AdminUser = AdminUserRow;

/** Deployments are not exposed on the GraphQL gateway; kept for UI typing only. */
export interface Deployment {
  id: string;
  version: string;
  environment: "production" | "staging";
  status: "running" | "deploying" | "failed" | "rolled_back";
  deployedAt: string;
  deployedBy: string;
  commitSha: string;
  commitMessage: string;
  rollbackAvailable: boolean;
}

/** Extended shape for legacy admin dashboard cards (extras are zeros). */
export interface AdminStats extends AdminUserStats {
  totalEmailsFound: number;
  totalEmailsVerified: number;
  creditsConsumedToday: number;
  activeJobs: number;
  systemLoadPercent: number;
}

function mapAdminStats(raw: AdminUserStats): AdminStats {
  return {
    ...raw,
    totalEmailsFound: 0,
    totalEmailsVerified: 0,
    creditsConsumedToday: 0,
    activeJobs: 0,
    systemLoadPercent: 0,
  };
}

type UserListItem = {
  uuid: string;
  email: string;
  name: string | null;
  isActive: boolean;
  lastSignInAt: string | null;
  createdAt: string;
  bucket?: string | null;
  profile: {
    role: string | null;
    credits: number;
    subscriptionPlan: string | null;
  } | null;
};

function mapUserRows(items: UserListItem[]): AdminUserRow[] {
  return items.map((u) => ({
    id: u.uuid,
    email: u.email,
    fullName: u.name ?? u.email,
    role: (u.profile?.role ?? "unknown").toLowerCase(),
    plan: u.profile?.subscriptionPlan ?? "free",
    credits: u.profile?.credits ?? 0,
    isActive: u.isActive,
    createdAt: u.createdAt,
    lastLoginAt: u.lastSignInAt,
    bucket: u.bucket ?? null,
  }));
}

export const adminService = {
  async getUserStats(): Promise<AdminUserStats> {
    const data = await graphqlQuery<{
      admin: { userStats: AdminUserStats };
    }>(ADMIN_USER_STATS_QUERY);
    return data.admin.userStats;
  },

  /** Extended shape for legacy admin dashboard cards (extras are zeros). */
  async getStats(): Promise<AdminStats> {
    const s = await adminService.getUserStats();
    return mapAdminStats(s);
  },

  async getLogStatistics(timeRange = "24h"): Promise<LogStatistics> {
    const data = await graphqlQuery<{
      admin: { logStatistics: LogStatistics };
    }>(ADMIN_LOG_STATISTICS_QUERY, { timeRange });
    return data.admin.logStatistics;
  },

  /**
   * SuperAdmin: `admin.users`. Admin (non-super): `admin.usersWithBuckets` (RBAC).
   */
  async listUsers(
    page = 1,
    limit = 20,
    options?: { useBuckets?: boolean },
  ): Promise<{ users: AdminUserRow[]; total: number }> {
    const offset = (page - 1) * limit;
    const useBuckets = options?.useBuckets ?? false;

    if (useBuckets) {
      const data = await graphqlQuery<{
        admin: {
          usersWithBuckets: {
            items: UserListItem[];
            pageInfo: PageInfo;
          };
        };
      }>(ADMIN_USERS_WITH_BUCKETS_QUERY, { filters: { limit, offset } });
      const conn = data.admin.usersWithBuckets;
      return { users: mapUserRows(conn.items), total: conn.pageInfo.total };
    }

    const data = await graphqlQuery<{
      admin: {
        users: {
          items: UserListItem[];
          pageInfo: PageInfo;
        };
      };
    }>(ADMIN_USERS_QUERY, { filters: { limit, offset } });

    const conn = data.admin.users;
    return { users: mapUserRows(conn.items), total: conn.pageInfo.total };
  },

  async updateUserRole(userId: string, role: string): Promise<boolean> {
    await graphqlMutation<{
      admin: { updateUserRole: { uuid: string } };
    }>(ADMIN_UPDATE_USER_ROLE_MUTATION, {
      input: { userId, role },
    });
    return true;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const data = await graphqlMutation<{
      admin: { deleteUser: boolean };
    }>(ADMIN_DELETE_USER_MUTATION, { input: { userId } });
    return data.admin.deleteUser;
  },

  async promoteToAdmin(userId: string) {
    const data = await graphqlMutation<{
      admin: { promoteToAdmin: { uuid: string; email: string } };
    }>(ADMIN_PROMOTE_TO_ADMIN_MUTATION, { input: { userId } });
    return data.admin.promoteToAdmin;
  },

  async promoteToSuperAdmin(userId: string) {
    const data = await graphqlMutation<{
      admin: { promoteToSuperAdmin: { uuid: string; email: string } };
    }>(ADMIN_PROMOTE_TO_SUPER_ADMIN_MUTATION, { input: { userId } });
    return data.admin.promoteToSuperAdmin;
  },

  /** Not implemented on gateway — no-op rejection. */
  async deactivateUser(_userId: string): Promise<boolean> {
    throw new Error("admin.deactivateUser is not exposed on the gateway");
  },

  async listDeployments(): Promise<Deployment[]> {
    return [];
  },

  async rollbackDeployment(_deploymentId: string): Promise<boolean> {
    throw new Error("Deployments are not exposed on the GraphQL gateway");
  },

  async getLogs(filters?: {
    level?: string;
    logger?: string;
    userId?: string;
    requestId?: string;
    limit?: number;
    offset?: number;
    startTime?: string;
    endTime?: string;
  }) {
    const data = await graphqlQuery<{
      admin: { logs: LogConnection };
    }>(ADMIN_LOGS_QUERY, {
      filters: {
        level: filters?.level ?? null,
        logger: filters?.logger ?? null,
        userId: filters?.userId ?? null,
        requestId: filters?.requestId ?? null,
        limit: filters?.limit ?? 50,
        offset: filters?.offset ?? 0,
        startTime: filters?.startTime ?? null,
        endTime: filters?.endTime ?? null,
      },
    });
    return data.admin.logs;
  },

  async searchLogs(query: string, limit = 50, offset = 0) {
    const data = await graphqlQuery<{
      admin: {
        searchLogs: {
          items: LogEntry[];
          pageInfo: PageInfo;
          query: string;
        };
      };
    }>(ADMIN_SEARCH_LOGS_QUERY, { input: { query, limit, offset } });
    return data.admin.searchLogs;
  },

  async getUserHistory(filters?: {
    userId?: string;
    eventType?: string;
    limit?: number;
    offset?: number;
  }) {
    const data = await graphqlQuery<{
      admin: { userHistory: UserHistoryConnection };
    }>(ADMIN_USER_HISTORY_QUERY, {
      filters: {
        userId: filters?.userId ?? null,
        eventType: filters?.eventType ?? null,
        limit: filters?.limit ?? 50,
        offset: filters?.offset ?? 0,
      },
    });
    return data.admin.userHistory;
  },

  /** `UpdateUserCreditsInput` is only `userId` + `credits` on the gateway. */
  async updateUserCredits(input: { userId: string; credits: number }) {
    const data = await graphqlMutation<{
      admin: {
        updateUserCredits: {
          uuid: string;
          email: string;
          profile: { credits: number } | null;
        };
      };
    }>(ADMIN_UPDATE_USER_CREDITS_MUTATION, {
      input: { userId: input.userId, credits: input.credits },
    });
    return data.admin.updateUserCredits;
  },
};

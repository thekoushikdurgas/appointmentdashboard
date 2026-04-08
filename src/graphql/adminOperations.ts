/** GraphQL operations for the Admin module (`AdminQuery`, `AdminMutation`). */

export const ADMIN_USER_STATS_QUERY = `query AdminUserStats {
  admin {
    userStats {
      totalUsers
      activeUsers
      usersByRole
      usersByPlan
    }
  }
}`;

export const ADMIN_USERS_QUERY = `query AdminUsers($filters: UserFilterInput) {
  admin {
    users(filters: $filters) {
      items {
        uuid
        email
        name
        isActive
        lastSignInAt
        createdAt
        profile {
          role
          credits
          subscriptionPlan
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

export const ADMIN_USERS_WITH_BUCKETS_QUERY = `query AdminUsersWithBuckets($filters: UserFilterInput) {
  admin {
    usersWithBuckets(filters: $filters) {
      items {
        uuid
        email
        name
        isActive
        lastSignInAt
        createdAt
        bucket
        profile {
          role
          credits
          subscriptionPlan
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

export const ADMIN_LOG_STATISTICS_QUERY = `query AdminLogStatistics($timeRange: String!) {
  admin {
    logStatistics(timeRange: $timeRange) {
      timeRange
      totalLogs
      byLevel
      errorRate
      avgResponseTimeMs
      slowQueriesCount
      byLogger
      topErrors {
        type
        count
        message
        lastSeen
      }
      performanceTrends {
        time
        avgDurationMs
        p95DurationMs
        slowQueriesCount
      }
      userActivity {
        activeUsers
        requestsPerUserAvg
        topUsers {
          userId
          requestCount
        }
      }
    }
  }
}`;

export const ADMIN_LOGS_QUERY = `query AdminLogs($filters: LogQueryFilterInput) {
  admin {
    logs(filters: $filters) {
      items {
        id
        level
        logger
        message
        requestId
        userId
        timestamp
        context
        performance
        error
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

export const ADMIN_SEARCH_LOGS_QUERY = `query AdminSearchLogs($input: LogSearchInput!) {
  admin {
    searchLogs(input: $input) {
      items {
        id
        level
        logger
        message
        requestId
        userId
        timestamp
        context
        performance
        error
      }
      pageInfo {
        total
        limit
        offset
        hasNext
        hasPrevious
      }
      query
    }
  }
}`;

export const ADMIN_USER_HISTORY_QUERY = `query AdminUserHistory($filters: UserHistoryFilterInput) {
  admin {
    userHistory(filters: $filters) {
      items {
        id
        eventType
        createdAt
        ip
        continent
        country
        city
        device
        userId
        userEmail
        userName
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

export const ADMIN_UPDATE_USER_ROLE_MUTATION = `mutation AdminUpdateUserRole($input: UpdateUserRoleInput!) {
  admin {
    updateUserRole(input: $input) {
      uuid
      email
      name
      profile {
        role
      }
    }
  }
}`;

export const ADMIN_UPDATE_USER_CREDITS_MUTATION = `mutation AdminUpdateUserCredits($input: UpdateUserCreditsInput!) {
  admin {
    updateUserCredits(input: $input) {
      uuid
      email
      profile {
        credits
      }
    }
  }
}`;

export const ADMIN_DELETE_USER_MUTATION = `mutation AdminDeleteUser($input: DeleteUserInput!) {
  admin {
    deleteUser(input: $input)
  }
}`;

export const ADMIN_PROMOTE_TO_ADMIN_MUTATION = `mutation AdminPromoteToAdmin($input: PromoteToAdminInput!) {
  admin {
    promoteToAdmin(input: $input) {
      uuid
      email
      name
      profile {
        role
      }
    }
  }
}`;

export const ADMIN_PROMOTE_TO_SUPER_ADMIN_MUTATION = `mutation AdminPromoteToSuperAdmin($input: PromoteToSuperAdminInput!) {
  admin {
    promoteToSuperAdmin(input: $input) {
      uuid
      email
      name
      profile {
        role
      }
    }
  }
}`;

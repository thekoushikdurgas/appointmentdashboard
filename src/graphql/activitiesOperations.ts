/** GraphQL operations for the Activities module (`ActivityQuery`: list + stats). */

export const ACTIVITIES_LIST_QUERY = `query ActivitiesGateway($filters: ActivityFilterInput) {
  activities {
    activities(filters: $filters) {
      items {
        id
        userId
        serviceType
        actionType
        status
        resultCount
        errorMessage
        createdAt
        requestParams
        resultSummary
        ipAddress
        userAgent
      }
      total
      limit
      offset
      hasNext
      hasPrevious
    }
  }
}`;

export const ACTIVITY_STATS_QUERY = `query ActivityStatsGateway($filters: ActivityStatsInput) {
  activities {
    activityStats(filters: $filters) {
      totalActivities
      byServiceType
      byActionType
      byStatus
      recentActivities
    }
  }
}`;

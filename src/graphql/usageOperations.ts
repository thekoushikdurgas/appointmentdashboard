/** GraphQL operations for the Usage module (`UsageQuery`, `UsageMutation`, root `featureOverview`). */

export const USAGE_QUERY = `query UsageGateway($feature: String) {
  usage {
    usage(feature: $feature) {
      features {
        feature
        used
        limit
        remaining
        resetAt
      }
    }
  }
}`;

export const FEATURE_OVERVIEW_QUERY = `query FeatureOverviewGateway($feature: String!) {
  featureOverview {
    featureOverview(feature: $feature) {
      feature
      usage {
        feature
        used
        limit
        remaining
        resetAt
      }
      activities {
        id
        userId
        serviceType
        actionType
        status
        resultCount
        errorMessage
        createdAt
      }
      jobs {
        id
        jobId
        jobType
        jobFamily
        jobSubtype
        status
        sourceService
        statusPayload
        createdAt
        updatedAt
      }
    }
  }
}`;

export const TRACK_USAGE_MUTATION = `mutation TrackUsage($input: TrackUsageInput!) {
  usage {
    trackUsage(input: $input) {
      feature
      used
      limit
      success
    }
  }
}`;

export const RESET_USAGE_MUTATION = `mutation ResetUsage($input: ResetUsageInput!) {
  usage {
    resetUsage(input: $input) {
      feature
      used
      limit
      success
    }
  }
}`;

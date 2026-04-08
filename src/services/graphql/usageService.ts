import { graphqlQuery, graphqlMutation } from "@/lib/graphqlClient";
import {
  USAGE_QUERY,
  FEATURE_OVERVIEW_QUERY,
  TRACK_USAGE_MUTATION,
  RESET_USAGE_MUTATION,
} from "@/graphql/usageOperations";
import type {
  FeatureUsageInfo,
  FeatureOverview,
  TrackUsageInput,
  TrackUsageResponse,
  ResetUsageInput,
  ResetUsageResponse,
} from "@/graphql/generated/types";

export type FeatureUsage = FeatureUsageInfo;
export type { FeatureOverview };

export const usageService = {
  getUsage: (feature?: string) =>
    graphqlQuery<{ usage: { usage: { features: FeatureUsageInfo[] } } }>(
      USAGE_QUERY,
      { feature: feature ?? null },
    ),

  getFeatureOverview: (feature: string) =>
    graphqlQuery<{
      featureOverview: { featureOverview: FeatureOverview };
    }>(FEATURE_OVERVIEW_QUERY, { feature }),

  trackUsage: (input: TrackUsageInput) =>
    graphqlMutation<{ usage: { trackUsage: TrackUsageResponse } }>(
      TRACK_USAGE_MUTATION,
      {
        input: {
          feature: input.feature,
          amount: input.amount ?? 1,
        },
      },
    ),

  resetUsage: (input: ResetUsageInput) =>
    graphqlMutation<{ usage: { resetUsage: ResetUsageResponse } }>(
      RESET_USAGE_MUTATION,
      { input },
    ),
};

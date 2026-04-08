import { graphqlQuery } from "@/lib/graphqlClient";
import {
  ACTIVITIES_LIST_QUERY,
  ACTIVITY_STATS_QUERY,
} from "@/graphql/activitiesOperations";
import type {
  Activity,
  ActivityConnection,
  ActivityFilterInput,
  ActivityStats,
} from "@/graphql/generated/types";

export type { Activity, ActivityConnection, ActivityStats };

export type ActivitiesListFilter = Partial<
  Pick<
    ActivityFilterInput,
    | "serviceType"
    | "actionType"
    | "status"
    | "startDate"
    | "endDate"
    | "limit"
    | "offset"
  >
>;

function buildListFilters(filter?: ActivitiesListFilter): ActivityFilterInput {
  const out: ActivityFilterInput = {
    limit: filter?.limit ?? 50,
    offset: filter?.offset ?? 0,
  };
  if (filter?.serviceType) out.serviceType = filter.serviceType;
  if (filter?.actionType) out.actionType = filter.actionType;
  if (filter?.status) out.status = filter.status;
  if (filter?.startDate) out.startDate = filter.startDate;
  if (filter?.endDate) out.endDate = filter.endDate;
  return out;
}

type ActivitiesListData = {
  activities: {
    activities: ActivityConnection;
  };
};

type ActivityStatsData = {
  activities: {
    activityStats: ActivityStats;
  };
};

export const activitiesService = {
  list: (filter?: ActivitiesListFilter) =>
    graphqlQuery<ActivitiesListData>(ACTIVITIES_LIST_QUERY, {
      filters: buildListFilters(filter),
    }),

  getStats: (filters?: { startDate?: string; endDate?: string }) => {
    const f: { startDate?: string; endDate?: string } = {};
    if (filters?.startDate) f.startDate = filters.startDate;
    if (filters?.endDate) f.endDate = filters.endDate;
    return graphqlQuery<ActivityStatsData>(ACTIVITY_STATS_QUERY, {
      filters: Object.keys(f).length ? f : {},
    });
  },
};

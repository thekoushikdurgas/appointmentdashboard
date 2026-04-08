import { graphqlQuery, graphqlMutation, gql } from "@/lib/graphqlClient";
import type {
  AggregateMetricsInput,
  GetMetricsInput,
  MetricAggregation,
  PerformanceMetricResponse,
  SubmitPerformanceMetricInput,
} from "@/graphql/generated/types";

export interface PerformanceMetricRow {
  id: string;
  userId: string;
  metricName: string;
  metricValue: number;
  timestamp: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export type MetricAggregationRow = MetricAggregation;

/** @deprecated Gateway exposes `analytics.performanceMetrics`, not a summary document. */
export interface AnalyticsSummary {
  period: "7d" | "30d" | "90d";
  totalEmailsFound: number;
  totalEmailsVerified: number;
  totalCreditsUsed: number;
  avgDailyEmails: number;
  successRate: number;
  dailyMetrics: Array<{
    date: string;
    emailsFound: number;
    emailsVerified: number;
    creditsUsed: number;
  }>;
  topDomains: Array<{ domain: string; count: number; successRate: number }>;
  usageByFeature: Array<{ feature: string; count: number; percent: number }>;
}

export type TopDomain = AnalyticsSummary["topDomains"][number];

const PERFORMANCE_METRICS = gql`
  query PerformanceMetrics($input: GetMetricsInput) {
    analytics {
      performanceMetrics(input: $input) {
        id
        userId
        metricName
        metricValue
        timestamp
        metadata
        createdAt
      }
    }
  }
`;

const AGGREGATE = gql`
  query AggregateMetrics($input: AggregateMetricsInput!) {
    analytics {
      aggregateMetrics(input: $input) {
        avg
        min
        max
        p50
        p75
        p95
        count
      }
    }
  }
`;

const SUBMIT_PERFORMANCE_METRIC = gql`
  mutation SubmitPerformanceMetric($input: SubmitPerformanceMetricInput!) {
    analytics {
      submitPerformanceMetric(input: $input) {
        success
        message
      }
    }
  }
`;

export const analyticsService = {
  async listPerformanceMetrics(
    input?: GetMetricsInput,
  ): Promise<PerformanceMetricRow[]> {
    const data = await graphqlQuery<{
      analytics: { performanceMetrics: PerformanceMetricRow[] };
    }>(PERFORMANCE_METRICS, { input: input ?? {} });
    return data.analytics.performanceMetrics;
  },

  async aggregateMetrics(
    input: AggregateMetricsInput,
  ): Promise<MetricAggregationRow> {
    const data = await graphqlQuery<{
      analytics: { aggregateMetrics: MetricAggregationRow };
    }>(AGGREGATE, { input });
    return data.analytics.aggregateMetrics;
  },

  async submitPerformanceMetric(
    input: SubmitPerformanceMetricInput,
    options?: { showToastOnError?: boolean },
  ): Promise<PerformanceMetricResponse> {
    const data = await graphqlMutation<{
      analytics: { submitPerformanceMetric: PerformanceMetricResponse };
    }>(SUBMIT_PERFORMANCE_METRIC, { input }, options);
    return data.analytics.submitPerformanceMetric;
  },

  /** @deprecated Use `listPerformanceMetrics` + date filters; do not use for product KPIs. */
  async getSummary(period: "7d" | "30d" | "90d"): Promise<AnalyticsSummary> {
    const rows = await analyticsService.listPerformanceMetrics({ limit: 500 });
    void period;
    const byName = new Map<string, number>();
    let sum = 0;
    for (const r of rows) {
      byName.set(r.metricName, (byName.get(r.metricName) ?? 0) + 1);
      sum += r.metricValue;
    }
    const usageByFeature = [...byName.entries()].map(([feature, count]) => ({
      feature,
      count,
      percent: rows.length ? Math.round((count / rows.length) * 100) : 0,
    }));
    return {
      period,
      totalEmailsFound: 0,
      totalEmailsVerified: 0,
      totalCreditsUsed: Math.round(sum),
      avgDailyEmails: rows.length ? sum / rows.length : 0,
      successRate: 0,
      dailyMetrics: [],
      topDomains: [],
      usageByFeature,
    };
  },
};

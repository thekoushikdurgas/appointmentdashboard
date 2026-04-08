"use client";

import { useState } from "react";
import { Activity, Gauge, Hash, RefreshCw, Timer } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Table, TableColumn } from "@/components/ui/Table";
import { StatCard } from "@/components/shared/StatCard";
import { PerformanceMetricsLineChart } from "@/components/feature/analytics/PerformanceMetricsLineChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/lib/analyticsPeriod";
import { formatMetricValue } from "@/lib/analyticsMetricFormat";
import { cn, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { PerformanceMetricRow } from "@/services/graphql/analyticsService";

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const METRIC_OPTIONS = [
  { value: "LCP", label: "LCP (largest contentful paint)" },
  { value: "INP", label: "INP (interaction to next paint)" },
  { value: "CLS", label: "CLS (cumulative layout shift)" },
  { value: "FCP", label: "FCP (first contentful paint)" },
  { value: "TTFB", label: "TTFB (time to first byte)" },
];

const ROW_COLUMNS: TableColumn<PerformanceMetricRow>[] = [
  {
    key: "timestamp",
    header: "Time",
    render: (row) => (
      <span title={new Date(row.timestamp ?? row.createdAt).toISOString()}>
        {formatRelativeTime(row.timestamp ?? row.createdAt)}
      </span>
    ),
  },
  {
    key: "metricValue",
    header: "Value",
    align: "right",
    render: (row) => (
      <span className="c360-tabular-nums">
        {formatMetricValue(row.metricName, row.metricValue)}
      </span>
    ),
  },
  {
    key: "metadata",
    header: "Metadata",
    render: (row) => {
      const meta = row.metadata;
      if (!meta || typeof meta !== "object")
        return <span className="c360-text-muted">—</span>;
      const s = JSON.stringify(meta);
      return (
        <span title={s} className="c360-analytics-meta-json">
          {s}
        </span>
      );
    },
  },
];

export function AnalyticsPerformancePanel() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [metricName, setMetricName] = useState("LCP");

  const { rows, aggregation, loading, error, refresh } = useAnalytics({
    period,
    metricName,
  });

  return (
    <>
      {error && (
        <Alert variant="danger" className="c360-mb-4">
          {error}
        </Alert>
      )}

      <Alert variant="info" className="c360-mb-4">
        Performance data comes from{" "}
        <strong>analytics.performanceMetrics</strong> and{" "}
        <strong>aggregateMetrics</strong>. Values are scoped to your account.
        Web Vitals are reported automatically while you use the app (see{" "}
        <Badge color="blue">RUM</Badge>
        ).
      </Alert>

      <div className="c360-analytics-toolbar">
        <div>
          <label
            className="c360-label c360-analytics-field-label"
            htmlFor="analytics-metric"
          >
            Metric
          </label>
          <Select
            id="analytics-metric"
            options={METRIC_OPTIONS}
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            fullWidth={false}
            className="c360-analytics-select--metric"
          />
        </div>
        <div>
          <label
            className="c360-label c360-analytics-field-label"
            htmlFor="analytics-period"
          >
            Range
          </label>
          <Select
            id="analytics-period"
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
            fullWidth={false}
            className="c360-analytics-select--period"
          />
        </div>
        <Button
          variant="secondary"
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Refresh analytics"
        >
          <RefreshCw
            size={16}
            className={cn("c360-mr-1-5", loading && "c360-spin")}
          />
          Refresh
        </Button>
      </div>

      <div className="c360-widget-grid c360-analytics-stat-grid">
        <StatCard
          label="Average"
          value={
            aggregation ? formatMetricValue(metricName, aggregation.avg) : "—"
          }
          icon={<Activity size={20} />}
        />
        <StatCard
          label="p50"
          value={
            aggregation ? formatMetricValue(metricName, aggregation.p50) : "—"
          }
          icon={<Timer size={20} />}
        />
        <StatCard
          label="p95"
          value={
            aggregation ? formatMetricValue(metricName, aggregation.p95) : "—"
          }
          icon={<Gauge size={20} />}
        />
        <StatCard
          label="Samples"
          value={aggregation ? formatNumber(aggregation.count) : "—"}
          icon={<Hash size={20} />}
        />
      </div>

      <div className="c360-analytics-chart-solo">
        <Card
          title={`${metricName} — daily average`}
          subtitle="Aggregated per day from stored samples"
        >
          <PerformanceMetricsLineChart
            rows={rows}
            seriesName={`${metricName} (avg / day)`}
          />
        </Card>
      </div>

      <Card
        title="Raw samples"
        subtitle="Most recent rows in the selected range"
      >
        <Table<PerformanceMetricRow>
          columns={ROW_COLUMNS}
          data={rows}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyState="No performance samples for this metric and range"
        />
      </Card>
    </>
  );
}

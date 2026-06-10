"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  buildPostingSourceBreakdown,
  buildTopCompanies,
  buildTopIndustries,
} from "@/lib/hiringAnalytics";
import { HeatmapTable } from "@/components/feature/hiring-analytics/HeatmapTable";
import { HorizontalBarChart } from "@/components/feature/hiring-analytics/HorizontalBarChart";

export function SourcesTab({ jobs }: { jobs: LinkedInJobRow[] }) {
  const sources = useMemo(() => buildPostingSourceBreakdown(jobs, 15), [jobs]);
  const companies = useMemo(() => buildTopCompanies(jobs, 15), [jobs]);
  const industries = useMemo(() => buildTopIndustries(jobs, 12), [jobs]);

  const srcRows = useMemo(() => {
    const total = jobs.length || 1;
    return sources.map((s) => ({
      domain: s.name,
      count: s.value,
      pct: Math.round((s.value / total) * 1000) / 10,
    }));
  }, [sources, jobs.length]);

  const coRows = useMemo(() => {
    const total = jobs.length || 1;
    return companies.map((s) => ({
      company: s.name,
      count: s.value,
      pct: Math.round((s.value / total) * 1000) / 10,
    }));
  }, [companies, jobs.length]);

  return (
    <div className="c360-section-stack">
      <Card title="Top posting sources" subtitle="Hostname from job link">
        <HeatmapTable
          rows={srcRows as unknown as Record<string, unknown>[]}
          columns={[
            { id: "domain", header: "Source" },
            {
              id: "count",
              header: "Postings",
              heatmap: true,
              align: "right",
            },
            { id: "pct", header: "%", align: "right" },
          ]}
          valueKey="count"
        />
      </Card>
      <Card title="Top companies">
        <HeatmapTable
          rows={coRows as unknown as Record<string, unknown>[]}
          columns={[
            { id: "company", header: "Company" },
            {
              id: "count",
              header: "Postings",
              heatmap: true,
              align: "right",
            },
            { id: "pct", header: "%", align: "right" },
          ]}
          valueKey="count"
        />
      </Card>
      <Card title="Top industries">
        <HorizontalBarChart data={industries} height={300} />
      </Card>
      <Card title="Company size &amp; type">
        <p className="c360-text-sm c360-text-muted">
          Requires company enrichment — coming when attributes are wired.
        </p>
      </Card>
      <p className="c360-text-xs c360-text-muted">
        Based on LinkedIn-derived hiring signals in Contact360.
      </p>
    </div>
  );
}

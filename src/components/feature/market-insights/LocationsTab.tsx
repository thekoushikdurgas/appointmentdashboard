"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  buildLocationBreakdown,
  buildLocationMomentum,
} from "@/lib/hiringAnalytics";
import { HeatmapTable } from "@/components/feature/hiring-analytics/HeatmapTable";

export function LocationsTab({ jobs }: { jobs: LinkedInJobRow[] }) {
  const loc = useMemo(() => buildLocationBreakdown(jobs, 25), [jobs]);
  const momentum = useMemo(() => buildLocationMomentum(jobs), [jobs]);

  const heatRows = useMemo(
    () =>
      loc.map((r) => ({
        country: r.country,
        location: r.location,
        count: r.count,
      })) as unknown as Record<string, unknown>[],
    [loc],
  );

  const newR = momentum.newLocations.map((x) => ({
    name: x.name,
    count: x.value,
  }));
  const up = momentum.increased.map((x) => ({
    name: x.name,
    pct: x.pct,
  }));
  const down = momentum.decreased.map((x) => ({
    name: x.name,
    pct: x.pct,
  }));

  return (
    <div className="c360-section-stack">
      <Card title="Top locations">
        <HeatmapTable
          rows={heatRows}
          columns={[
            { id: "country", header: "Country" },
            { id: "location", header: "Location" },
            {
              id: "count",
              header: "Postings",
              heatmap: true,
              align: "right",
            },
          ]}
          valueKey="count"
        />
      </Card>
      <div className="c360-2col-grid c360-lg-grid-cols-3">
        <Card title="New locations" subtitle="Late window only">
          <HeatmapTable
            rows={newR as unknown as Record<string, unknown>[]}
            columns={[
              { id: "name", header: "Location" },
              {
                id: "count",
                header: "Postings",
                heatmap: true,
                align: "right",
              },
            ]}
            valueKey="count"
            emptyLabel="None detected."
          />
        </Card>
        <Card title="Increased MoM %" subtitle="vs early window">
          <HeatmapTable
            rows={up as unknown as Record<string, unknown>[]}
            columns={[
              { id: "name", header: "Location" },
              {
                id: "pct",
                header: "Δ%",
                heatmap: true,
                align: "right",
              },
            ]}
            valueKey="pct"
            emptyLabel="None detected."
          />
        </Card>
        <Card title="Decreased MoM %" subtitle="vs early window">
          <HeatmapTable
            rows={down as unknown as Record<string, unknown>[]}
            columns={[
              { id: "name", header: "Location" },
              {
                id: "pct",
                header: "Δ%",
                heatmap: true,
                align: "right",
              },
            ]}
            valueKey="pct"
            emptyLabel="None detected."
          />
        </Card>
      </div>
    </div>
  );
}

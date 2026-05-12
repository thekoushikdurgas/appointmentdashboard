"use client";

import { useMemo } from "react";
import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

export interface HiringSignalTopCompaniesCardProps {
  jobs: LinkedInJobRow[];
  onOpenCompanyDrawer: (row: LinkedInJobRow) => void;
}

export function HiringSignalTopCompaniesCard({
  jobs,
  onOpenCompanyDrawer,
}: HiringSignalTopCompaniesCardProps) {
  const topCompanies = useMemo(() => {
    const map = new Map<
      string,
      { name: string; uuid: string; count: number; sample: LinkedInJobRow }
    >();
    for (const j of jobs) {
      const uuid = j.companyUuid?.trim();
      if (!uuid) continue;
      const cur = map.get(uuid);
      if (!cur) {
        map.set(uuid, { name: j.companyName, uuid, count: 1, sample: j });
      } else {
        cur.count += 1;
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 6);
  }, [jobs]);

  return (
    <Card
      title="Top companies"
      subtitle="By open roles on this list (click to open panel)"
      className="c360-hs-dashboard-top-companies-card"
    >
      {topCompanies.length === 0 ? (
        <p className="c360-text-sm c360-text-muted">
          No company_uuid on visible rows — link jobs to Connectra first.
        </p>
      ) : (
        <ul
          className="c360-m-0 c360-list-none c360-p-0 c360-hs-dashboard-companies-list"
          role="list"
        >
          {topCompanies.map((c) => (
            <li key={c.uuid} className="c360-hs-dashboard-company-li">
              <button
                type="button"
                className="c360-flex c360-w-full c360-items-center c360-justify-between c360-gap-2 c360-border c360-border-ink-8 c360-bg-ink-1/30 c360-text-left c360-hs-hover-primary-border c360-hs-dashboard-company-btn"
                onClick={() => onOpenCompanyDrawer(c.sample)}
              >
                <span className="c360-flex c360-min-w-0 c360-items-center c360-gap-2">
                  <Building2
                    size={18}
                    className="c360-shrink-0 c360-text-primary"
                    aria-hidden
                  />
                  <span className="c360-truncate c360-font-medium c360-text-ink">
                    {c.name || c.uuid}
                  </span>
                </span>
                <Badge color="info" size="sm">
                  {c.count}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

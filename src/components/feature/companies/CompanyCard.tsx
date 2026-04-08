"use client";

import Link from "next/link";
import { Building2, ExternalLink, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCompact } from "@/lib/utils";

export interface CompanyCardData {
  id: string;
  name?: string | null;
  domain?: string | null;
  websiteUrl?: string | null;
  employeesCount?: number | null;
  industries?: string[] | null;
  address?: string | null;
}

export interface CompanyCardProps {
  company: CompanyCardData;
  onAction?: (id: string, action: "email" | "view") => void;
}

/**
 * CompanyCard — StatCard-style card for the companies grid view.
 *
 * Shows: logo initial, name, domain, employee count badge, industry tags,
 * and quick action buttons.
 */
export function CompanyCard({ company, onAction }: CompanyCardProps) {
  const initial = (company.name ?? "?")[0].toUpperCase();

  return (
    <div className="c360-card c360-flex c360-flex-col">
      <div className="c360-card__body">
        <div className="c360-company-card-header">
          <div className="c360-company-icon-box" aria-hidden>
            <Building2 size={20} className="c360-text-primary" />
          </div>
          <div className="c360-min-w-0">
            <Link
              href={`/companies/${company.id}`}
              className="c360-company-name-link"
            >
              {company.name ?? "(unnamed)"}
            </Link>
            {company.domain && (
              <div className="c360-text-xs c360-text-muted c360-truncate">
                {company.domain}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="c360-company-stats-row c360-mt-3">
          {company.employeesCount != null && (
            <span className="c360-company-stat">
              <Users size={12} className="c360-text-muted" />
              <span>{formatCompact(company.employeesCount)}</span>
            </span>
          )}
          {company.address && (
            <span className="c360-text-xs c360-text-muted c360-truncate">
              {company.address}
            </span>
          )}
        </div>

        {/* Industry tags */}
        {company.industries && company.industries.length > 0 && (
          <div className="c360-badge-row c360-mt-2 c360-flex-wrap">
            {company.industries.slice(0, 3).map((ind) => (
              <Badge key={ind} color="secondary" size="sm">
                {ind}
              </Badge>
            ))}
            {company.industries.length > 3 && (
              <Badge color="secondary" size="sm">
                +{company.industries.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Footer initials + actions */}
      <div className="c360-card__footer c360-flex c360-items-center c360-justify-between">
        <div
          className="c360-avatar c360-avatar--sm c360-avatar--primary"
          title={company.name ?? undefined}
          aria-label={`Initial for ${company.name}`}
        >
          {initial}
        </div>
        <div className="c360-flex c360-gap-1">
          {company.websiteUrl && (
            <Button asChild variant="ghost" size="sm">
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit website"
              >
                <ExternalLink size={13} />
              </a>
            </Button>
          )}
          {onAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction(company.id, "view")}
            >
              View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

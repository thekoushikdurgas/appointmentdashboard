"use client";

import { useState } from "react";
import {
  Building2,
  ExternalLink,
  FileText,
  Linkedin,
  Mail,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  employmentTypeBadgeColor,
  hiringSignalInitials,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import {
  formatHireSignalPostedParts,
  isHireSignalPostedDateOnly,
} from "@/lib/jobs/hiringSignalPostedDate";

export function hiringSignalsIsRemoteAllowed(remote: string): boolean {
  const x = remote.trim().toLowerCase();
  return (
    x === "true" ||
    x === "yes" ||
    x === "1" ||
    x.includes("remote") ||
    x.includes("hybrid")
  );
}

/** Prefer geo string; when LinkedIn omits location, show workplace types if present. */
export function hiringSignalsDisplayLocationForRow(
  row: LinkedInJobRow,
): string {
  const geo = row.location?.trim();
  if (geo) return geo;
  const wt = row.workplaceTypes?.filter(Boolean) ?? [];
  if (wt.length) return wt.join(", ");
  return "—";
}

/** Logo with fallback to initials when URL fails or returns a broken asset. */
export function HiringSignalsCompanyAvatar({
  logoUrl,
  companyName,
}: {
  logoUrl?: string | null;
  companyName?: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const raw = logoUrl?.trim();
  const showImg = Boolean(raw && !imgFailed);

  return (
    <div className="c360-hs-avatar c360-hs-grid-company-avatar" aria-hidden>
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote URLs from raw_payload / ingest
        <img
          src={proxiedCompanyLogoSrc(raw!)}
          alt=""
          className="c360-h-full c360-w-full c360-object-cover"
          onError={() => setImgFailed(true)}
          loading="lazy"
        />
      ) : (
        <span className="c360-hs-grid-company-avatar__initials">
          {hiringSignalInitials(companyName || "C")}
        </span>
      )}
    </div>
  );
}

export function HiringSignalsJobTitleCellCompact({
  row,
}: {
  row: LinkedInJobRow;
}) {
  return (
    <span
      className="c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-sm c360-font-medium c360-text-ink"
      title={row.title || undefined}
    >
      {row.title || "—"}
    </span>
  );
}

export function HiringSignalsJobTitleCellComfortable({
  row,
  onOpenDescription,
  showDescriptionButton = true,
}: {
  row: LinkedInJobRow;
  onOpenDescription: (row: LinkedInJobRow) => void;
  /** When false, omit JD (e.g. drawer lists where description is not wired). */
  showDescriptionButton?: boolean;
}) {
  return (
    <div className="c360-hs-grid-title-stack">
      <div className="c360-hs-grid-title-stack__row">
        <span
          className="c360-hs-grid-title-stack__title c360-min-w-0 c360-font-medium c360-text-ink"
          title={row.title || undefined}
        >
          {row.title || "—"}
        </span>
        {showDescriptionButton ? (
          <Tooltip content="Job description" placement="top">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="c360-hs-grid-title-stack__jd c360-shrink-0 c360-gap-1 c360-px-2"
              onClick={() => onOpenDescription(row)}
              aria-label="View job description"
            >
              <FileText size={16} aria-hidden />
              JD
            </Button>
          </Tooltip>
        ) : null}
      </div>
      {row.seniority ? (
        <p className="c360-hs-grid-title-stack__meta">{row.seniority}</p>
      ) : null}
    </div>
  );
}

export function HiringSignalsJobLocationCell({ row }: { row: LinkedInJobRow }) {
  return (
    <span className="c360-hs-grid-meta-text">
      {hiringSignalsDisplayLocationForRow(row)}
    </span>
  );
}

export function HiringSignalsJobTypeBadgesCell({
  row,
  badgeSize,
}: {
  row: LinkedInJobRow;
  badgeSize: "sm" | "md";
}) {
  return (
    <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-2">
      {row.employmentType ? (
        <Badge
          color={employmentTypeBadgeColor(row.employmentType)}
          size={badgeSize}
        >
          {row.employmentType}
        </Badge>
      ) : (
        <span className="c360-text-xs c360-text-ink-muted">—</span>
      )}
      {hiringSignalsIsRemoteAllowed(row.remoteAllowed) ? (
        <Badge color="emerald" size={badgeSize}>
          Remote
        </Badge>
      ) : null}
    </div>
  );
}

export function HiringSignalsJobPostedCell({
  row,
  showTime = true,
}: {
  row: LinkedInJobRow;
  /** When false (compact table view), only the calendar date is shown; time stays in the tooltip. */
  showTime?: boolean;
}) {
  const raw = row.postedAt?.trim() ?? "";
  if (!raw) {
    return (
      <span className="c360-hs-grid-meta-text c360-hs-grid-posted">—</span>
    );
  }
  const { date } = formatHireSignalPostedParts(raw);
  const clockRaw = row.postedClockAt?.trim() ?? "";
  const clockParts = clockRaw ? formatHireSignalPostedParts(clockRaw) : null;
  const time =
    clockParts?.time ??
    (isHireSignalPostedDateOnly(raw)
      ? null
      : formatHireSignalPostedParts(raw).time);
  const dateOnly = isHireSignalPostedDateOnly(raw);
  let title = dateOnly
    ? `Posted date: ${raw}${clockRaw ? ` · indexed ${clockRaw}` : ""}`
    : raw;
  if (!showTime && time) {
    title = `${title} · ${time}`;
  }
  return (
    <span className="c360-hs-grid-posted" title={title}>
      <span className="c360-hs-grid-posted__date">{date}</span>
      {showTime && time ? (
        <span className="c360-hs-grid-posted__time">{time}</span>
      ) : null}
    </span>
  );
}

export function HiringSignalsJobActionsCellMain({
  row,
  iconSz,
  onOpenCompany,
  onOpenConnectra,
}: {
  row: LinkedInJobRow;
  iconSz: number;
  onOpenCompany: (row: LinkedInJobRow) => void;
  onOpenConnectra: (row: LinkedInJobRow) => void;
}) {
  return (
    <div
      className="c360-hs-grid-actions-row c360-flex c360-items-center c360-justify-end"
      role="group"
      aria-label={`Actions for ${row.title || "job"}`}
    >
      {row.companyUuid ? (
        <Tooltip content="Company roles (Mongo)" placement="top">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="c360-hs-grid-action-btn c360-gap-1 c360-px-2"
            onClick={() => onOpenCompany(row)}
            aria-label="Open company roles"
          >
            <Building2 size={iconSz} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
      <Tooltip content="Connectra profile & people" placement="top">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="c360-hs-grid-action-btn c360-gap-1 c360-px-2"
          onClick={() => onOpenConnectra(row)}
          aria-label="Open Connectra data"
        >
          <Users size={iconSz} aria-hidden />
        </Button>
      </Tooltip>
      {row.jobUrl ? (
        <Tooltip content="Open on LinkedIn" placement="top">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            asChild
            className="c360-hs-grid-action-btn c360-p-2"
          >
            <a
              href={row.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open job on LinkedIn"
            >
              <ExternalLink size={iconSz} aria-hidden />
            </a>
          </Button>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function HiringSignalsJobActionsCellLinkedInOnly({
  row,
  iconSz,
}: {
  row: LinkedInJobRow;
  iconSz: number;
}) {
  return (
    <div
      className="c360-hs-grid-actions-row c360-flex c360-items-center c360-justify-end"
      role="group"
      aria-label={`Actions for ${row.title || "job"}`}
    >
      {row.jobUrl ? (
        <Tooltip content="Open on LinkedIn" placement="top">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            asChild
            className="c360-hs-grid-action-btn c360-p-2"
          >
            <a
              href={row.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open job on LinkedIn"
            >
              <ExternalLink size={iconSz} aria-hidden />
            </a>
          </Button>
        </Tooltip>
      ) : (
        <span className="c360-text-ink-muted">—</span>
      )}
    </div>
  );
}

export function HiringSignalsJobCompanyCellCompact({
  row,
  onOpenCompanyDrawer,
}: {
  row: LinkedInJobRow;
  onOpenCompanyDrawer?: (row: LinkedInJobRow) => void;
}) {
  if (onOpenCompanyDrawer && row.companyUuid) {
    return (
      <button
        type="button"
        className="c360-hs-table__company-link c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-left c360-text-sm c360-font-medium c360-text-ink hover:c360-underline"
        onClick={() => onOpenCompanyDrawer(row)}
      >
        {row.companyName || "—"}
      </button>
    );
  }
  return (
    <span className="c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-sm c360-font-medium c360-text-ink">
      {row.companyName || "—"}
    </span>
  );
}

export function HiringSignalsJobCompanyCellComfortable({
  row,
  onOpenCompanyDrawer,
}: {
  row: LinkedInJobRow;
  onOpenCompanyDrawer?: (row: LinkedInJobRow) => void;
}) {
  return (
    <div className="c360-hs-grid-company-cell">
      <HiringSignalsCompanyAvatar
        logoUrl={row.companyLogoUrl}
        companyName={row.companyName}
      />
      <div className="c360-min-w-0 c360-flex-1">
        {onOpenCompanyDrawer && row.companyUuid ? (
          <button
            type="button"
            className="c360-hs-table__company-link c360-block c360-max-w-full c360-truncate c360-text-left c360-text-sm c360-font-medium c360-text-ink hover:c360-underline"
            onClick={() => onOpenCompanyDrawer(row)}
          >
            {row.companyName || "—"}
          </button>
        ) : (
          <span className="c360-text-sm c360-font-medium c360-text-ink">
            {row.companyName || "—"}
          </span>
        )}
        {row.functionCategory ? (
          <p className="c360-m-0 c360-mt-0-5 c360-text-xs c360-text-ink-muted">
            {row.functionCategory}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Contact initials cell (drawer contacts grid). */
export function HiringSignalsContactInitialsCell({ name }: { name: string }) {
  return (
    <div className="c360-hs-avatar c360-mx-auto" aria-hidden>
      {hiringSignalInitials(name || "?")}
    </div>
  );
}

/**
 * Connectra drawer contacts: mask email until revealed.
 * Parent grid reveals stored email (free/starter) or runs email.findEmails (pro/super-admin).
 * Once revealed, only `resolvedEmail` is shown — stored Connectra email is not used as fallback.
 */
export function HiringSignalDrawerContactEmailCell({
  isRevealed,
  resolvedEmail,
  loading,
  onFindClick,
}: {
  isRevealed: boolean;
  resolvedEmail: string;
  loading: boolean;
  onFindClick: () => void;
}) {
  if (!isRevealed) {
    return (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        loading={loading}
        disabled={loading}
        leftIcon={<Mail size={12} aria-hidden />}
        className="c360-max-w-full c360-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onFindClick();
        }}
      >
        Find email
      </Button>
    );
  }

  // Revealed value is authoritative (API result for Pro, copied stored for Free).
  const email = resolvedEmail.trim();
  if (email) {
    return (
      <a
        href={`mailto:${email}`}
        className="c360-block c360-min-w-0 c360-max-w-full c360-truncate c360-text-2xs c360-text-primary hover:c360-underline"
        title={email}
        onClick={(e) => e.stopPropagation()}
      >
        {email}
      </a>
    );
  }

  return (
    <span className="c360-text-2xs c360-text-ink-muted" title="No email found">
      Not found
    </span>
  );
}

export function HiringSignalsContactLinkedInCell({
  linkedinUrl,
  iconSz,
}: {
  linkedinUrl: string;
  iconSz: number;
}) {
  if (!linkedinUrl.trim()) {
    return <span className="c360-text-ink-muted">—</span>;
  }
  return (
    <div className="c360-hs-grid-actions-row c360-flex c360-items-center c360-justify-end">
      <Tooltip content="LinkedIn profile" placement="top">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          asChild
          className="c360-hs-grid-action-btn c360-p-0-5"
        >
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin size={iconSz} aria-hidden />
          </a>
        </Button>
      </Tooltip>
    </div>
  );
}

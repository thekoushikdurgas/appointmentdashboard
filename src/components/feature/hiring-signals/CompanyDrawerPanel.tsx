"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MediaObject } from "@/components/ui/MediaObject";
import { CompanyHiringTab } from "@/components/feature/companies/CompanyHiringTab";
import {
  fetchConnectraCompany,
  asRecord,
} from "@/services/graphql/hiringSignalService";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  hiringSignalInitials,
  pickCompanyDisplay,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { HiringSignalAsideDrawer } from "@/components/feature/hiring-signals/HiringSignalAsideDrawer";
import { HiringSignalCompanyWebsiteButton } from "@/components/feature/hiring-signals/HiringSignalCompanyWebsiteButton";
import { HiringSignalCompanyLinkedInButton } from "@/components/feature/hiring-signals/HiringSignalCompanyLinkedInButton";
import { toast } from "sonner";

export interface CompanyDrawerPanelProps {
  anchor: LinkedInJobRow | null;
  /** Jobs on the current list for this company (titles / functions). */
  previewJobs: LinkedInJobRow[];
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyDrawerPanel({
  anchor,
  previewJobs,
  isOpen,
  onClose,
}: CompanyDrawerPanelProps) {
  const [cRecord, setCRecord] = useState<unknown | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);

  const companyUuid = anchor?.companyUuid?.trim() ?? "";
  const companyName = anchor?.companyName || "Company";

  const rolePills = useMemo(() => {
    const fc = new Set<string>();
    for (const j of previewJobs) {
      if (j.functionCategory?.trim()) fc.add(j.functionCategory.trim());
    }
    return [...fc].slice(0, 8);
  }, [previewJobs]);

  useEffect(() => {
    if (!isOpen || !companyUuid) {
      setCRecord(null);
      setCompanyLoading(false);
      return;
    }
    let cancelled = false;
    setCompanyLoading(true);
    (async () => {
      try {
        const rec = await fetchConnectraCompany(companyUuid);
        if (cancelled) return;
        const rr = asRecord(rec.hireSignal?.connectraCompany);
        if (rr && rr.success !== false) {
          setCRecord(rr.data ?? null);
        } else {
          setCRecord(null);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Load failed";
          toast.error("Company panel", { description: msg });
          setCRecord(null);
        }
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyUuid]);

  const co = pickCompanyDisplay(cRecord);
  const companyDisplayName = co.name || companyName;

  const companyLogoMedia = companyLoading ? (
    <span
      className="c360-skeleton c360-block c360-h-50 c360-w-50 c360-rounded-full"
      aria-hidden
    />
  ) : (
    <div className="c360-stat-card__icon c360-flex c360-h-50 c360-w-50 c360-shrink-0 c360-overflow-hidden c360-rounded-full">
      {co.profilePic ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote logo URLs from Connectra / scraper
        <img
          src={proxiedCompanyLogoSrc(co.profilePic)}
          alt=""
          className="c360-h-full c360-w-full c360-object-cover"
        />
      ) : (
        hiringSignalInitials(companyDisplayName)
      )}
    </div>
  );

  const companyMetaBody =
    !companyLoading &&
    (co.website || co.industry || co.employees || co.linkedinUrl) ? (
      <div className="c360-hs-drawer__header-meta c360-text-2xs c360-text-ink-muted">
        {co.website ? (
          <HiringSignalCompanyWebsiteButton website={co.website} />
        ) : null}
        {co.industry ? <p className="c360-text-ink">{co.industry}</p> : null}
        {co.employees ? <p>~{co.employees} employees</p> : null}
        {co.linkedinUrl ? (
          <HiringSignalCompanyLinkedInButton linkedinUrl={co.linkedinUrl} />
        ) : null}
      </div>
    ) : null;

  return (
    <HiringSignalAsideDrawer
      isOpen={isOpen && !!anchor}
      onClose={onClose}
      ariaLabelledBy="c360-hs-drawer-title"
    >
      <header className="c360-hs-drawer__header">
        <div className="c360-min-w-0 c360-flex-1">
          {companyLoading ? (
            <MediaObject
              className="c360-hs-drawer__header-company"
              media={companyLogoMedia}
              title={
                <h2
                  id="c360-hs-drawer-title"
                  className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                >
                  {companyDisplayName}
                </h2>
              }
              body={
                <p className="c360-m-0 c360-flex c360-items-center c360-gap-2 c360-text-2xs c360-text-ink-muted">
                  <Loader2
                    className="c360-animate-spin"
                    size={14}
                    aria-hidden
                  />
                  Loading company profile…
                </p>
              }
            />
          ) : (
            <MediaObject
              className="c360-hs-drawer__header-company"
              media={companyLogoMedia}
              title={
                <h2
                  id="c360-hs-drawer-title"
                  className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                >
                  {companyUuid ? (
                    <Link
                      href={`/companies/${companyUuid}`}
                      onClick={onClose}
                      className="c360-text-primary hover:c360-underline c360-break-words"
                    >
                      {companyDisplayName}
                    </Link>
                  ) : (
                    companyDisplayName
                  )}
                </h2>
              }
              body={companyMetaBody}
            />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="c360-shrink-0"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </Button>
      </header>

      <div className="c360-hs-drawer__body">
        <p className="c360-mb-4 c360-text-sm c360-text-muted">
          <span className="c360-font-medium c360-text-ink">Open roles</span> on
          this page: {previewJobs.length}
        </p>

        {rolePills.length > 0 ? (
          <section className="c360-mb-4">
            <p className="c360-mb-2 c360-text-2xs c360-font-medium c360-uppercase c360-tracking-wide c360-text-muted">
              Hiring functions (this page)
            </p>
            <div className="c360-flex c360-flex-wrap c360-gap-1">
              {rolePills.map((p) => (
                <Badge key={p} color="gray" size="sm">
                  {p}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        <section
          className="c360-mb-1"
          aria-label="Hiring analytics for this page"
        >
          <CompanyHiringTab jobs={previewJobs} loading={false} />
        </section>
      </div>
    </HiringSignalAsideDrawer>
  );
}

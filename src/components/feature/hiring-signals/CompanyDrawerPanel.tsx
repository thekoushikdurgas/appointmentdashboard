"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Linkedin, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CompanyHiringTab } from "@/components/feature/companies/CompanyHiringTab";
import { fetchConnectraCompany, asRecord } from "@/services/graphql/hiringSignalService";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  hiringSignalInitials,
  pickCompanyDisplay,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { HiringSignalAsideDrawer } from "@/components/feature/hiring-signals/HiringSignalAsideDrawer";
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
      return;
    }
    let cancelled = false;
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
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyUuid]);

  const co = pickCompanyDisplay(cRecord);

  return (
    <HiringSignalAsideDrawer
      isOpen={isOpen && !!anchor}
      onClose={onClose}
      ariaLabelledBy="c360-hs-drawer-title"
    >
      <header className="c360-hs-drawer__header">
        <div className="c360-flex c360-items-start c360-gap-3">
          <div
            className="c360-hs-drawer__avatar c360-overflow-hidden c360-rounded-full"
            aria-hidden
          >
            {co.profilePic ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote logo URLs from Connectra / scraper
              <img
                src={proxiedCompanyLogoSrc(co.profilePic)}
                alt=""
                className="c360-h-full c360-w-full c360-object-cover"
              />
            ) : (
              hiringSignalInitials(companyName)
            )}
          </div>
          <div className="c360-min-w-0">
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
                  {co.name || companyName}
                </Link>
              ) : (
                co.name || companyName
              )}
            </h2>
            {co.industry ? (
              <Badge color="info" size="sm" className="c360-mt-2">
                {co.industry}
              </Badge>
            ) : null}
          </div>
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
        <div className="c360-mb-4 c360-grid c360-gap-2 c360-text-sm">
          <p className="c360-m-0 c360-text-muted">
            <span className="c360-font-medium c360-text-ink">Open roles</span>{" "}
            on this page: {previewJobs.length}
          </p>
          {co.employees ? (
            <p className="c360-m-0 c360-text-muted">
              <span className="c360-font-medium c360-text-ink">
                Employees (Connectra)
              </span>{" "}
              ~{co.employees}
            </p>
          ) : null}
          {co.website ? (
            <a
              href={
                co.website.startsWith("http")
                  ? co.website
                  : `https://${co.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="c360-text-primary"
            >
              {co.website}
            </a>
          ) : null}
          {co.linkedinUrl ? (
            <a
              href={co.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="c360-inline-flex c360-items-center c360-gap-1 c360-text-primary"
            >
              <Linkedin size={16} />
              Company LinkedIn
            </a>
          ) : null}
        </div>

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

        <section className="c360-mb-1" aria-label="Hiring analytics for this page">
          <CompanyHiringTab jobs={previewJobs} loading={false} />
        </section>
      </div>

      <footer className="c360-hs-drawer__footer">
        <Button type="button" variant="primary" size="sm" onClick={onClose}>
          Done
        </Button>
      </footer>
    </HiringSignalAsideDrawer>
  );
}

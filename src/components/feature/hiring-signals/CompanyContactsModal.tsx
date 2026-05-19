"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MediaObject } from "@/components/ui/MediaObject";
import {
  fetchCompanyHiringSignalJobs,
  fetchConnectraCompany,
  asRecord,
} from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";
import {
  normalizeLinkedInJobRow,
  type LinkedInJobRow,
} from "@/hooks/useHiringSignals";
import {
  hiringSignalInitials,
  pickCompanyDisplay,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { HiringSignalAsideDrawer } from "@/components/feature/hiring-signals/HiringSignalAsideDrawer";
import { HiringSignalDrawerJobsGrid } from "@/components/feature/hiring-signals/HiringSignalDrawerJobsGrid";
import { HiringSignalCompanyWebsiteButton } from "@/components/feature/hiring-signals/HiringSignalCompanyWebsiteButton";
import { HiringSignalCompanyLinkedInButton } from "@/components/feature/hiring-signals/HiringSignalCompanyLinkedInButton";

const modalTableShellScrollClass =
  "c360-data-table-shell__scroll--modal c360-min-h-0";

function rowFromItem(item: unknown): LinkedInJobRow {
  const o = asRecord(item) ?? {};
  const base = normalizeLinkedInJobRow(item);
  const jobState = String(o.jobState ?? o.job_state ?? "").trim();
  const lastSeen = String(
    o.lastSeenAt ?? o.last_seen_at ?? o.lastSeen ?? "",
  ).trim();
  return {
    ...base,
    linkedinJobId: String(
      o.linkedinJobId ?? o.linkedin_job_id ?? base.linkedinJobId,
    ),
    runId: String(o.runId ?? o.run_id ?? base.runId),
    apifyItemId: String(o.apifyItemId ?? o.apify_item_id ?? base.apifyItemId),
    companyUuid: String(o.companyUuid ?? o.company_uuid ?? base.companyUuid),
    companyName: String(o.companyName ?? o.company_name ?? base.companyName),
    title: String(o.title ?? base.title),
    descriptionHtml: String(
      o.descriptionHTML ??
        o.descriptionHtml ??
        o.description ??
        base.descriptionHtml,
    ),
    postedAt: String(o.postedAt ?? o.posted_at ?? base.postedAt),
    jobUrl: String(o.jobUrl ?? o.job_url ?? base.jobUrl),
    jobState: jobState || undefined,
    remoteAllowed: String(
      o.remoteAllowed ?? o.remote_allowed ?? base.remoteAllowed,
    ),
    employmentType: String(
      o.employmentType ?? o.employment_type ?? base.employmentType,
    ),
    seniority: String(o.seniorityLevel ?? o.seniority ?? base.seniority),
    functionCategory: String(
      o.functionCategoryV2 ??
        o.function_category_v2 ??
        o.functionCategory ??
        base.functionCategory,
    ),
    industries: String(o.industries ?? base.industries),
    location: String(
      o.formattedLocationFull ?? o.location_str ?? o.location ?? base.location,
    ),
    lastSeen: lastSeen || undefined,
  };
}

export interface CompanyContactsModalProps {
  companyUuid: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  density?: "comfortable" | "compact";
}

/**
 * Company: Mongo job rows for the same `company_uuid`, plus Connectra (sync) profile in the header strip.
 */
export function CompanyContactsModal({
  companyUuid,
  companyName,
  isOpen,
  onClose,
  density = "comfortable",
}: CompanyContactsModalProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LinkedInJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [cRecord, setCRecord] = useState<unknown | null>(null);
  const [selectedJobKeys, setSelectedJobKeys] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!isOpen) setSelectedJobKeys(new Set());
  }, [isOpen]);

  useEffect(() => {
    setSelectedJobKeys(new Set());
  }, [companyUuid]);

  /** Load company record on open for header logo and links. */
  useEffect(() => {
    if (!isOpen || !companyUuid.trim()) return;
    let cancelled = false;
    setCompanyLoading(true);
    (async () => {
      try {
        const rec = await fetchConnectraCompany(companyUuid);
        if (cancelled) return;
        const rr = asRecord(rec.hireSignal?.connectraCompany);
        if (rr && rr.success === false) {
          setCRecord(null);
        } else {
          setCRecord(rr?.data ?? null);
        }
      } catch {
        if (!cancelled) setCRecord(null);
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyUuid]);

  useEffect(() => {
    if (!isOpen || !companyUuid.trim()) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchCompanyHiringSignalJobs(companyUuid, 100);
        const raw = res.hireSignal?.companyJobs;
        const r = asRecord(raw);
        const data = (r?.data as unknown) ?? [];
        const list = Array.isArray(data) ? data.map(rowFromItem) : [];
        const t = Number(r?.total ?? 0) || list.length;
        if (!cancelled) {
          setRows(list);
          setTotal(t);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Load failed";
          toast.error("Company jobs", { description: msg });
          setRows([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
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
        {co.industry ? <p className="c360-text-ink">{co.industry}</p> : null}
        {co.website ? (
          <HiringSignalCompanyWebsiteButton website={co.website} />
        ) : null}
        {co.employees ? <p>~{co.employees} employees</p> : null}
        {co.linkedinUrl ? (
          <HiringSignalCompanyLinkedInButton linkedinUrl={co.linkedinUrl} />
        ) : null}
      </div>
    ) : null;

  return (
    <HiringSignalAsideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="c360-hs-company-contacts-title"
    >
      <header className="c360-hs-drawer__header">
        <div className="c360-min-w-0 c360-flex-1">
          {companyLoading ? (
            <MediaObject
              className="c360-hs-drawer__header-company"
              media={companyLogoMedia}
              title={
                <h2
                  id="c360-hs-company-contacts-title"
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
                  id="c360-hs-company-contacts-title"
                  className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                >
                  {companyDisplayName}
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
        <div className="c360-mb-2">
          <p className="c360-hs-drawer__jobs-meta c360-text-2xs c360-text-ink-muted">
            {loading
              ? "Loading open roles…"
              : `Showing ${rows.length} of ${total} row(s) for this company.`}
          </p>
          {loading && rows.length === 0 ? (
            <div className="c360-flex c360-items-center c360-gap-2 c360-py-8 c360-text-ink-muted">
              <Loader2 className="c360-animate-spin" size={20} />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="c360-py-6 c360-text-center c360-text-sm c360-text-ink-muted">
              No jobs returned for this company. Try a refresh after the next
              scrape.
            </p>
          ) : (
            <HiringSignalDrawerJobsGrid
              rows={rows}
              loading={loading}
              density={density}
              selectedKeys={selectedJobKeys}
              onSelectionChange={setSelectedJobKeys}
              scrollClassName={modalTableShellScrollClass}
            />
          )}
        </div>
      </div>

      <footer className="c360-hs-drawer__footer">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </footer>
    </HiringSignalAsideDrawer>
  );
}

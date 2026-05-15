"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  ExternalLink,
  Linkedin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
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
  formatHireSignalPostedDate,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { HiringSignalAsideDrawer } from "@/components/feature/hiring-signals/HiringSignalAsideDrawer";

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
}

/**
 * Company: Mongo job rows for the same `company_uuid`, plus Connectra (sync) profile in the header strip.
 */
export function CompanyContactsModal({
  companyUuid,
  companyName,
  isOpen,
  onClose,
}: CompanyContactsModalProps) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LinkedInJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [cRecord, setCRecord] = useState<unknown | null>(null);

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

  const companyWebsiteHref = (website: string) => {
    const w = website.trim();
    if (!w) return "";
    if (/^https?:\/\//i.test(w)) return w;
    return `https://${w}`;
  };

  return (
    <HiringSignalAsideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="c360-hs-company-contacts-title"
    >
      <header className="c360-hs-drawer__header">
        <h2
          id="c360-hs-company-contacts-title"
          className="c360-m-0 c360-min-w-0 c360-text-lg c360-font-semibold c360-text-ink"
        >
          Company on hiring signal
        </h2>
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
      <div className="c360-mb-3 c360-flex c360-items-start c360-gap-3 c360-rounded c360-border c360-border-ink-8 c360-bg-ink-2/15 c360-p-3">
        <div
          className="c360-stat-card__icon c360-relative c360-flex c360-h-10 c360-w-10 c360-shrink-0 c360-overflow-hidden c360-rounded-full"
          aria-hidden
        >
          {companyLoading ? (
            <span
              className="c360-skeleton c360-block c360-rounded-full"
              style={{ width: 40, height: 40 }}
              aria-hidden
            />
          ) : co.profilePic ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote logo URLs from Connectra / scraper
            <img
              src={proxiedCompanyLogoSrc(co.profilePic)}
              alt=""
              className="c360-absolute c360-inset-0 c360-block c360-h-full c360-w-full c360-object-cover"
            />
          ) : (
            hiringSignalInitials(companyName)
          )}
        </div>
        <div className="c360-min-w-0 c360-flex-1">
          <p className="c360-font-medium c360-text-ink">{companyName}</p>
          {companyUuid ? (
            <p className="c360-font-mono c360-mt-0-5 c360-text-2xs c360-text-ink-muted c360-break-all">
              {companyUuid}
            </p>
          ) : null}
          {co.industry ||
          co.website ||
          co.employees ||
          co.linkedinUrl ? (
            <div className="c360-mt-2 c360-space-y-1">
              {co.industry ? (
                <Badge color="info" size="sm">
                  {co.industry}
                </Badge>
              ) : null}
              <div className="c360-flex c360-flex-wrap c360-items-center c360-gap-x-3 c360-gap-y-1 c360-text-sm c360-text-ink">
                {co.website ? (
                  <a
                    href={companyWebsiteHref(co.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c360-inline-flex c360-items-center c360-gap-1 c360-text-primary hover:c360-underline"
                  >
                    <ExternalLink size={14} />
                    Website
                  </a>
                ) : null}
                {co.linkedinUrl ? (
                  <a
                    href={co.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="c360-inline-flex c360-items-center c360-gap-1 c360-text-primary hover:c360-underline"
                  >
                    <Linkedin size={14} />
                    Company LinkedIn
                  </a>
                ) : null}
              </div>
              {co.employees ? (
                <p className="c360-text-2xs c360-text-ink-muted">
                  Employees: {co.employees}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <Building2
          size={20}
          className="c360-mt-0-5 c360-shrink-0 c360-text-ink-muted"
          aria-hidden
        />
      </div>

      <div className="c360-mb-2">
        <p className="c360-mb-1 c360-text-sm c360-font-medium c360-text-ink">
          Open roles (Mongo)
        </p>
        <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
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
          <C360DataTableShell scrollClassName={modalTableShellScrollClass}>
            <div className="c360-table-wrapper c360-w-full">
              <table className="c360-table c360-w-full">
                <thead>
                  <tr>
                    <th className="c360-min-w-0">Title</th>
                    <th className="c360-whitespace-nowrap">Location</th>
                    <th className="c360-whitespace-nowrap">Type</th>
                    <th className="c360-whitespace-nowrap">Posted</th>
                    <th className="c360-text-right c360-whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.linkedinJobId}-${row.apifyItemId}`}>
                      <td className="c360-min-w-0 c360-max-w-[14rem] c360-font-medium">
                        <span
                          className="c360-block c360-truncate c360-text-sm"
                          title={row.title}
                        >
                          {row.title}
                        </span>
                      </td>
                      <td className="c360-text-2xs c360-text-ink-muted">
                        {row.location?.trim() ? (
                          <span className="c360-line-clamp-2">
                            {row.location}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="c360-text-2xs c360-text-ink-muted">
                        {row.employmentType?.trim() || "—"}
                      </td>
                      <td className="c360-text-2xs c360-text-ink-muted c360-whitespace-nowrap">
                        {formatHireSignalPostedDate(row.postedAt, {
                          withTime: false,
                          emptyAsDash: true,
                        })}
                      </td>
                      <td className="c360-text-right">
                        {row.jobUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="c360-p-0-5"
                            asChild
                          >
                            <a
                              href={row.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Open job on LinkedIn"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </Button>
                        ) : (
                          <span className="c360-text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </C360DataTableShell>
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

"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  fetchCompanyHiringSignalJobs,
  asRecord,
} from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

function rowFromItem(item: unknown): LinkedInJobRow {
  const o = asRecord(item) ?? {};
  return {
    linkedinJobId: String(o.linkedinJobId ?? o.linkedin_job_id ?? ""),
    runId: String(o.runId ?? o.run_id ?? ""),
    apifyItemId: String(o.apifyItemId ?? o.apify_item_id ?? ""),
    companyUuid: String(o.companyUuid ?? o.company_uuid ?? ""),
    companyName: String(o.companyName ?? o.company_name ?? ""),
    companyLinkedin: String(
      o.companyLinkedinUrl ?? o.company_linkedin_url ?? "",
    ),
    companyLogoUrl: String(o.companyLogoUrl ?? o.company_logo_url ?? ""),
    companyStaffCount:
      Number(o.companyStaffCount ?? o.company_staff_count ?? 0) || 0,
    title: String(o.title ?? ""),
    descriptionHtml: String(
      o.descriptionHTML ?? o.descriptionHtml ?? o.description ?? "",
    ),
    postedAt: String(o.postedAt ?? o.posted_at ?? ""),
    jobUrl: String(o.jobUrl ?? o.job_url ?? ""),
    jobState: String(o.jobState ?? o.job_state ?? ""),
    remoteAllowed: String(o.remoteAllowed ?? o.remote_allowed ?? ""),
    employmentType: String(o.employmentType ?? o.employment_type ?? ""),
    seniority: String(o.seniorityLevel ?? o.seniority ?? ""),
    functionCategory: String(
      o.functionCategoryV2 ??
        o.function_category_v2 ??
        o.functionCategory ??
        "",
    ),
    industries: String(o.industries ?? ""),
    companyDescription: String(
      o.companyDescriptionV2 ?? o.company_description_v2 ?? "",
    ),
    location: String(
      o.formattedLocationFull ?? o.location_str ?? o.location ?? "",
    ),
    lastSeen: String(o.lastSeenAt ?? o.last_seen_at ?? o.lastSeen ?? ""),
  };
}

export interface CompanyContactsModalProps {
  companyUuid: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Company-scoped view: other open roles (same company) from job.server via gateway.
 * Contact payloads from Connectra are not exposed here; use Companies for CRM contacts.
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Company on hiring signal"
      size="lg"
    >
      <div className="c360-mb-3 c360-flex c360-items-start c360-gap-2 c360-text-sm c360-text-ink-muted">
        <Building2
          size={18}
          className="c360-mt-0.5 c360-shrink-0"
          aria-hidden
        />
        <div>
          <p className="c360-font-medium c360-text-ink">{companyName}</p>
          {companyUuid ? (
            <p className="c360-mono c360-text-2xs c360-text-ink-muted c360-break-all">
              {companyUuid}
            </p>
          ) : null}
          <p className="c360-mt-1 c360-text-2xs">
            {loading
              ? "Loading open roles…"
              : `Showing ${rows.length} of ${total} row(s) for this company.`}
          </p>
        </div>
      </div>

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
        <ul
          className="c360-max-h-[min(50vh,24rem)] c360-space-y-2 c360-overflow-auto c360-pr-1"
          role="list"
        >
          {rows.map((row) => (
            <li
              key={`${row.linkedinJobId}-${row.apifyItemId}`}
              className="c360-rounded c360-border c360-border-ink-12 c360-p-2"
            >
              <p className="c360-text-sm c360-font-medium c360-text-ink">
                {row.title}
              </p>
              {row.location ? (
                <p className="c360-text-2xs c360-text-ink-muted">
                  {row.location}
                </p>
              ) : null}
              {row.jobUrl ? (
                <a
                  href={row.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "c360-inline-flex c360-items-center c360-gap-1 c360-mt-1",
                    "c360-text-xs c360-text-primary hover:c360-underline",
                  )}
                >
                  <ExternalLink size={12} />
                  LinkedIn
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="c360-mt-4 c360-flex c360-justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, ExternalLink, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  fetchCompanyHiringSignalJobs,
  fetchConnectraCompany,
  fetchConnectraContactsForCompany,
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
 * Company: Mongo job rows for the same `company_uuid`, plus Connectra (sync) profile + people.
 */
export function CompanyContactsModal({
  companyUuid,
  companyName,
  isOpen,
  onClose,
}: CompanyContactsModalProps) {
  const [tab, setTab] = useState<"jobs" | "connectra">("jobs");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LinkedInJobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [cLoading, setCLoading] = useState(false);
  const [cRecord, setCRecord] = useState<unknown | null>(null);
  const [cPeople, setCPeople] = useState<unknown[]>([]);
  const [cErr, setCErr] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setTab("jobs");
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

  useEffect(() => {
    if (!isOpen || !companyUuid.trim() || tab !== "connectra") return;
    let cancelled = false;
    (async () => {
      setCLoading(true);
      setCErr(null);
      try {
        const [rec, peo] = await Promise.all([
          fetchConnectraCompany(companyUuid),
          fetchConnectraContactsForCompany(companyUuid, { limit: 50 }),
        ]);
        if (cancelled) return;
        const rr = asRecord(rec.hireSignal?.connectraCompany);
        const pr = asRecord(peo.hireSignal?.connectraContactsForCompany);
        if (rr && rr.success === false) {
          setCErr(String(rr.detail ?? "Connectra company failed"));
          setCRecord(null);
        } else {
          setCRecord(rr?.data ?? null);
        }
        if (pr && pr.success === false) {
          setCErr(
            (prev) => prev || String(pr.detail ?? "Connectra people failed"),
          );
          setCPeople([]);
        } else {
          const d = pr?.data;
          const arr =
            d && typeof d === "object" && !Array.isArray(d) && "contacts" in d
              ? (d as { contacts?: unknown[] }).contacts
              : null;
          setCPeople(Array.isArray(arr) ? arr : []);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Connectra load failed";
          setCErr(msg);
          setCRecord(null);
          setCPeople([]);
          toast.error("Connectra", { description: msg });
        }
      } finally {
        if (!cancelled) setCLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, companyUuid, tab]);

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
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "jobs" | "connectra")}
        className="c360-mb-2"
      >
        <TabsList>
          <TabsTrigger value="jobs">Open roles (Mongo)</TabsTrigger>
          <TabsTrigger value="connectra" icon={<Users size={14} />}>
            Connectra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
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
        </TabsContent>

        <TabsContent value="connectra">
          {cLoading ? (
            <div className="c360-flex c360-items-center c360-gap-2 c360-py-8 c360-text-ink-muted">
              <Loader2 className="c360-animate-spin" size={20} />
              Loading Connectra (job.server)…
            </div>
          ) : cErr ? (
            <p className="c360-text-sm c360-text-ink-muted" role="alert">
              {cErr}
            </p>
          ) : (
            <div className="c360-space-y-3 c360-text-2xs c360-text-ink-muted">
              <div>
                <p className="c360-mb-1 c360-font-medium c360-text-ink">
                  Company record
                </p>
                {cRecord ? (
                  <pre className="c360-max-h-40 c360-overflow-auto c360-rounded c360-bg-ink-2/20 c360-p-2">
                    {JSON.stringify(cRecord, null, 2).slice(0, 8000)}
                  </pre>
                ) : (
                  <p>None returned.</p>
                )}
              </div>
              <div>
                <p className="c360-mb-1 c360-font-medium c360-text-ink">
                  People (VQL)
                </p>
                {cPeople.length === 0 ? (
                  <p>No contacts, or list empty.</p>
                ) : (
                  <ul
                    className="c360-max-h-48 c360-space-y-1 c360-overflow-auto"
                    role="list"
                  >
                    {cPeople.map((row, i) => (
                      <li
                        key={i}
                        className="c360-font-mono c360-whitespace-pre-wrap c360-break-words c360-border c360-border-ink-8 c360-px-2 c360-py-1"
                      >
                        {JSON.stringify(row, null, 2).slice(0, 2000)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="c360-mt-4 c360-flex c360-justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  UserCircle2,
  Users,
  Linkedin,
  X,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { C360DataTableShell } from "@/components/ui/C360DataTableShell";
import { MediaObject } from "@/components/ui/MediaObject";
import {
  fetchJobConnectraCompany,
  fetchJobConnectraContacts,
  asRecord,
} from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  hiringSignalInitials,
  pickCompanyDisplay,
  pickContactDisplay,
  connectraContactStableKey,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { HiringSignalAsideDrawer } from "@/components/feature/hiring-signals/HiringSignalAsideDrawer";

type ConnectraState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      company: unknown;
      contacts: unknown[];
      poster: unknown | null;
    };

type ParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; message: string };

function parseJobServerJson(raw: unknown): ParseResult {
  const r = asRecord(raw);
  if (!r) return { ok: false, message: "Empty response" };
  if (r.success === false) {
    return {
      ok: false,
      message: String(r.detail ?? r.error ?? "Request failed"),
    };
  }
  const d = r.data;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    return { ok: true, data: d as Record<string, unknown> };
  }
  return { ok: false, message: "Invalid data shape" };
}

const modalTableShellScrollClass =
  "c360-data-table-shell__scroll--modal c360-min-h-0";

export interface JobConnectraModalProps {
  job: LinkedInJobRow;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * job.server read-through: Connectra (sync.server) company + contacts for this job.
 */
export function JobConnectraModal({
  job,
  isOpen,
  onClose,
}: JobConnectraModalProps) {
  const [state, setState] = useState<ConnectraState>({ kind: "idle" });

  useEffect(() => {
    if (!isOpen || !job.linkedinJobId.trim()) return;
    let cancelled = false;
    (async () => {
      setState({ kind: "loading" });
      try {
        const [co, ct] = await Promise.all([
          fetchJobConnectraCompany(job.linkedinJobId),
          fetchJobConnectraContacts(job.linkedinJobId, { limit: 50 }),
        ]);
        if (cancelled) return;
        const a = parseJobServerJson(co.hireSignal?.jobConnectraCompany);
        const b = parseJobServerJson(ct.hireSignal?.jobConnectraContacts);
        if (!a.ok) {
          setState({ kind: "error", message: a.message });
          return;
        }
        if (!b.ok) {
          setState({ kind: "error", message: b.message });
          return;
        }
        const company = a.data?.company;
        const contacts = b.data?.contacts;
        const poster = b.data?.job_poster_contact;
        const contactList = Array.isArray(contacts) ? contacts : [];
        setState({
          kind: "ok",
          company: company ?? null,
          contacts: contactList,
          poster: poster ?? null,
        });
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Failed to load Connectra data";
        setState({ kind: "error", message: msg });
        toast.error("Connectra (job)", { description: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, job.linkedinJobId]);

  const companyDisp =
    state.kind === "ok" ? pickCompanyDisplay(state.company) : null;
  const posterDisp =
    state.kind === "ok" && state.poster
      ? pickContactDisplay(state.poster)
      : null;

  const subtitleCanonical =
    companyDisp?.name?.trim() || job.companyName?.trim() || "";
  const rowNameNorm = job.companyName?.trim().toLowerCase() ?? "";
  const connectraNameNorm = companyDisp?.name?.trim().toLowerCase() ?? "";
  const companyNameMismatch =
    state.kind === "ok" &&
    Boolean(job.companyName?.trim()) &&
    Boolean(companyDisp?.name?.trim()) &&
    rowNameNorm !== connectraNameNorm;

  const exportContactsCsv = () => {
    if (state.kind !== "ok" || state.contacts.length === 0) {
      toast.message("Nothing to export", {
        description: "No contacts returned for this job.",
      });
      return;
    }
    const flat = state.contacts.map((row) => {
      const p = pickContactDisplay(row);
      return {
        name: p.name,
        title: p.title,
        email: p.email,
        linkedin_url: p.linkedinUrl,
      };
    });
    const csv = Papa.unparse(flat);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `connectra-contacts-job-${job.linkedinJobId.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported contacts", { description: `${flat.length} rows` });
  };

  return (
    <HiringSignalAsideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="c360-hs-job-connectra-title"
    >
      <header className="c360-hs-drawer__header">
        <h2
          id="c360-hs-job-connectra-title"
          className="c360-m-0 c360-min-w-0 c360-text-lg c360-font-semibold c360-text-ink"
        >
          Connectra for this role
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
      <div className="c360-mb-2 c360-space-y-1">
        <p className="c360-text-2xs c360-text-ink-muted">
          LinkedIn job{" "}
          <span className="c360-font-mono">{job.linkedinJobId}</span>
          {subtitleCanonical ? ` · ${subtitleCanonical}` : null}
        </p>
        {companyNameMismatch ? (
          <p className="c360-text-2xs c360-text-ink-muted">
            Hiring table showed “{job.companyName}”; Connectra company name is
            canonical above.
          </p>
        ) : null}
      </div>

      {state.kind === "loading" || state.kind === "idle" ? (
        <div className="c360-space-y-3 c360-py-4" aria-busy>
          <div className="c360-flex c360-items-center c360-gap-2 c360-text-ink-muted">
            <Loader2 className="c360-animate-spin" size={20} />
            Loading from job.server (Connectra)…
          </div>
          <div className="c360-skeleton c360-skeleton--w-full c360-skeleton--h-72" />
          <div className="c360-skeleton c360-skeleton--w-full c360-skeleton--h-96" />
          <div className="c360-skeleton c360-skeleton--w-full c360-skeleton--h-140" />
        </div>
      ) : null}

      {state.kind === "error" ? (
        <p className="c360-py-4 c360-text-sm c360-text-ink-muted" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.kind === "ok" ? (
        <div className="c360-space-y-4">
          <section
            className="c360-rounded c360-border c360-border-ink-8 c360-p-3"
            aria-labelledby="c360-connectra-company"
          >
            <h3
              id="c360-connectra-company"
              className="c360-mb-2 c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink"
            >
              <Building2 size={16} aria-hidden />
              Company
            </h3>
            {state.company ? (
              <MediaObject
                media={
                  <div className="c360-stat-card__icon c360-flex c360-h-10 c360-w-10 c360-shrink-0 c360-overflow-hidden c360-rounded-full">
                    {companyDisp?.profilePic ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote logo URLs from Connectra / scraper
                      <img
                        src={proxiedCompanyLogoSrc(companyDisp.profilePic)}
                        alt=""
                        className="c360-h-full c360-w-full c360-object-cover"
                      />
                    ) : (
                      hiringSignalInitials(
                        companyDisp?.name || job.companyName || "C",
                      )
                    )}
                  </div>
                }
                title={companyDisp?.name || job.companyName || "Company"}
                body={
                  <div className="c360-space-y-1 c360-text-2xs c360-text-ink-muted">
                    {companyDisp?.website ? <p>{companyDisp.website}</p> : null}
                    {companyDisp?.industry ? (
                      <p className="c360-text-ink">{companyDisp.industry}</p>
                    ) : null}
                    {companyDisp?.employees ? (
                      <p>~{companyDisp.employees} employees</p>
                    ) : null}
                    {companyDisp?.linkedinUrl ? (
                      <a
                        href={companyDisp.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="c360-inline-flex c360-items-center c360-gap-1 c360-text-primary"
                      >
                        <Linkedin size={14} />
                        LinkedIn
                      </a>
                    ) : null}
                  </div>
                }
              />
            ) : (
              <p className="c360-text-2xs c360-text-ink-muted">
                No company record. The job may need a completed Connectra
                company sync (set CONNECTRA on job.server and re-run the scrape
                pipeline).
              </p>
            )}
          </section>

          {state.poster ? (
            <section
              className="c360-rounded c360-border c360-border-amber-500/40 c360-bg-amber-500/5 c360-p-3"
              aria-labelledby="c360-connectra-poster"
            >
              <h3
                id="c360-connectra-poster"
                className="c360-mb-2 c360-flex c360-flex-wrap c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink"
              >
                <UserCircle2 size={16} aria-hidden />
                Job poster
                <Badge color="warning" size="sm">
                  Highlight
                </Badge>
              </h3>
              <div className="c360-flex c360-items-center c360-gap-3">
                <div
                  className="c360-flex c360-h-10 c360-w-10 c360-shrink-0 c360-items-center c360-justify-center c360-rounded-lg c360-border c360-border-ink-8 c360-bg-ink-1 c360-text-2xs c360-font-semibold c360-text-primary"
                  aria-hidden
                >
                  {hiringSignalInitials(posterDisp?.name || "?")}
                </div>
                <div className="c360-min-w-0">
                  <p className="c360-text-sm c360-font-medium c360-text-ink">
                    {posterDisp?.name || "Poster"}
                  </p>
                  {posterDisp?.title ? (
                    <p className="c360-text-2xs c360-text-ink-muted">
                      {posterDisp.title}
                    </p>
                  ) : null}
                  {posterDisp?.linkedinUrl ? (
                    <a
                      href={posterDisp.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c360-mt-1 c360-inline-flex c360-items-center c360-gap-1 c360-text-xs c360-text-primary"
                    >
                      <Linkedin size={14} />
                      Profile
                    </a>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section
            className="c360-rounded c360-border c360-border-ink-8 c360-p-3"
            aria-labelledby="c360-connectra-people"
          >
            <div className="c360-mb-2 c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
              <h3
                id="c360-connectra-people"
                className="c360-m-0 c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink"
              >
                <Users size={16} aria-hidden />
                People at this company
                {state.contacts.length
                  ? ` (${state.contacts.length} shown)`
                  : null}
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="c360-gap-1"
                onClick={exportContactsCsv}
                disabled={state.contacts.length === 0}
                leftIcon={<Download size={14} />}
              >
                Export CSV
              </Button>
            </div>
            {state.contacts.length === 0 ? (
              <p className="c360-text-2xs c360-text-ink-muted">
                No contacts indexed in Connectra for this job&apos;s{" "}
                <span className="c360-font-mono">company_uuid</span>. Export and
                indexing jobs may still be pending, or this company has no
                contact documents yet.
              </p>
            ) : (
              <C360DataTableShell scrollClassName={modalTableShellScrollClass}>
                <div className="c360-table-wrapper c360-w-full">
                  <table className="c360-table c360-w-full">
                    <thead>
                      <tr>
                        <th
                          className="c360-w-10 c360-text-center"
                          scope="col"
                          aria-label="Initials"
                        />
                        <th>Name</th>
                        <th className="c360-min-w-0">Title</th>
                        <th className="c360-text-right c360-whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.contacts.map((row, i) => {
                        const p = pickContactDisplay(row);
                        return (
                          <tr key={connectraContactStableKey(row, i)}>
                            <td className="c360-align-middle">
                              <div
                                className="c360-hs-avatar c360-mx-auto"
                                aria-hidden
                              >
                                {hiringSignalInitials(p.name)}
                              </div>
                            </td>
                            <td className="c360-text-sm c360-font-medium c360-text-ink">
                              {p.name}
                            </td>
                            <td className="c360-min-w-0 c360-max-w-[12rem] c360-text-2xs c360-text-ink-muted">
                              {p.title ? (
                                <span
                                  className="c360-line-clamp-2"
                                  title={p.title}
                                >
                                  {p.title}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="c360-text-right">
                              {p.linkedinUrl ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="c360-p-0-5"
                                  asChild
                                >
                                  <a
                                    href={p.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="LinkedIn"
                                  >
                                    <Linkedin size={16} />
                                  </a>
                                </Button>
                              ) : (
                                <span className="c360-text-ink-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </C360DataTableShell>
            )}
          </section>
        </div>
      ) : null}
      </div>

      <footer className="c360-hs-drawer__footer">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </footer>
    </HiringSignalAsideDrawer>
  );
}

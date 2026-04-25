"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Building2, Loader2, UserCircle2, Users, Linkedin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MediaObject } from "@/components/ui/MediaObject";
import {
  fetchJobConnectraCompany,
  fetchJobConnectraContacts,
  asRecord,
} from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  hiringSignalInitials,
  pickCompanyDisplay,
  pickContactDisplay,
  connectraContactStableKey,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";

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
        setState({
          kind: "ok",
          company: company ?? null,
          contacts: Array.isArray(contacts) ? contacts : [],
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connectra for this role"
      size="lg"
    >
      <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
        LinkedIn job <span className="c360-font-mono">{job.linkedinJobId}</span>
        {job.companyName ? ` · ${job.companyName}` : null}
      </p>

      {state.kind === "loading" || state.kind === "idle" ? (
        <div className="c360-space-y-3 c360-py-4" aria-busy>
          <div className="c360-flex c360-items-center c360-gap-2 c360-text-ink-muted">
            <Loader2 className="c360-animate-spin" size={20} />
            Loading from job.server (Connectra)…
          </div>
          <div
            className="c360-skeleton"
            style={
              {
                ["--c360-skeleton-h" as string]: "72px",
                ["--c360-skeleton-w" as string]: "100%",
              } as CSSProperties
            }
          />
          <div
            className="c360-skeleton"
            style={
              {
                ["--c360-skeleton-h" as string]: "96px",
                ["--c360-skeleton-w" as string]: "100%",
              } as CSSProperties
            }
          />
          <div
            className="c360-skeleton"
            style={
              {
                ["--c360-skeleton-h" as string]: "140px",
                ["--c360-skeleton-w" as string]: "100%",
              } as CSSProperties
            }
          />
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
                  <div className="c360-stat-card__icon">
                    {hiringSignalInitials(
                      companyDisp?.name || job.companyName || "C",
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
            <h3
              id="c360-connectra-people"
              className="c360-mb-2 c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink"
            >
              <Users size={16} aria-hidden />
              People at this company
              {state.contacts.length
                ? ` (${state.contacts.length} shown)`
                : null}
            </h3>
            {state.contacts.length === 0 ? (
              <p className="c360-text-2xs c360-text-ink-muted">
                No contact rows returned.
              </p>
            ) : (
              <ul
                className="c360-max-h-[min(40vh,18rem)] c360-space-y-2 c360-overflow-auto"
                role="list"
              >
                {state.contacts.map((row, i) => {
                  const p = pickContactDisplay(row);
                  return (
                    <li
                      key={connectraContactStableKey(row, i)}
                      className="c360-rounded c360-border c360-border-ink-8 c360-p-2"
                    >
                      <MediaObject
                        media={
                          <div className="c360-hs-avatar">
                            {hiringSignalInitials(p.name)}
                          </div>
                        }
                        title={
                          <span className="c360-text-xs c360-font-medium c360-text-ink">
                            {p.name}
                          </span>
                        }
                        body={
                          p.title ? (
                            <span className="c360-text-2xs c360-text-ink-muted">
                              {p.title}
                            </span>
                          ) : null
                        }
                        actions={
                          p.linkedinUrl ? (
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
                          ) : null
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : null}

      <div className={cn("c360-mt-4 c360-flex c360-justify-end")}>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

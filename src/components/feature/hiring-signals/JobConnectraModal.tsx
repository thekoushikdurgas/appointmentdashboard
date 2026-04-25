"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2, UserCircle2, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  fetchJobConnectraCompany,
  fetchJobConnectraContacts,
  asRecord,
} from "@/services/graphql/hiringSignalService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";

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

function snippetJson(v: unknown, max = 900) {
  const s = JSON.stringify(v, null, 2);
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
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
        <div className="c360-flex c360-items-center c360-gap-2 c360-py-8 c360-text-ink-muted">
          <Loader2 className="c360-animate-spin" size={20} />
          Loading from job.server (Connectra)…
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
              <pre className="c360-max-h-48 c360-overflow-auto c360-text-2xs c360-text-ink-muted c360-bg-ink-2/20 c360-p-2 c360-rounded">
                {snippetJson(state.company, 8000)}
              </pre>
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
              className="c360-rounded c360-border c360-border-ink-8 c360-p-3"
              aria-labelledby="c360-connectra-poster"
            >
              <h3
                id="c360-connectra-poster"
                className="c360-mb-2 c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink"
              >
                <UserCircle2 size={16} aria-hidden />
                Job poster
              </h3>
              <pre className="c360-max-h-40 c360-overflow-auto c360-text-2xs c360-text-ink-muted c360-bg-ink-2/20 c360-p-2 c360-rounded">
                {snippetJson(state.poster, 6000)}
              </pre>
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
                className="c360-max-h-[min(40vh,18rem)] c360-space-y-1 c360-overflow-auto"
                role="list"
              >
                {state.contacts.map((row, i) => (
                  <li
                    key={i}
                    className="c360-rounded c360-border c360-border-ink-8 c360-px-2 c360-py-1 c360-text-2xs c360-text-ink-muted c360-font-mono c360-whitespace-pre-wrap c360-break-words"
                  >
                    {snippetJson(row, 1200)}
                  </li>
                ))}
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

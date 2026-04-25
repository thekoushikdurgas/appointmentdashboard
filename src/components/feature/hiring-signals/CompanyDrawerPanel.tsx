"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Linkedin, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  fetchConnectraCompany,
  fetchConnectraContactsForCompany,
  asRecord,
} from "@/services/graphql/hiringSignalService";
import type { LinkedInJobRow } from "@/hooks/useHiringSignals";
import {
  hiringSignalInitials,
  pickCompanyDisplay,
  pickContactDisplay,
  connectraContactStableKey,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { MediaObject } from "@/components/ui/MediaObject";
import { toast } from "sonner";
import Papa from "papaparse";

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
  const [mounted, setMounted] = useState(false);
  const [cRecord, setCRecord] = useState<unknown | null>(null);
  const [cPeople, setCPeople] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

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
      setCPeople([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [rec, peo] = await Promise.all([
          fetchConnectraCompany(companyUuid),
          fetchConnectraContactsForCompany(companyUuid, { limit: 12 }),
        ]);
        if (cancelled) return;
        const rr = asRecord(rec.hireSignal?.connectraCompany);
        const pr = asRecord(peo.hireSignal?.connectraContactsForCompany);
        if (rr && rr.success !== false) {
          setCRecord(rr.data ?? null);
        } else {
          setCRecord(null);
        }
        if (pr && pr.success !== false) {
          const d = pr.data;
          const arr =
            d && typeof d === "object" && !Array.isArray(d) && "contacts" in d
              ? (d as { contacts?: unknown[] }).contacts
              : null;
          setCPeople(Array.isArray(arr) ? arr : []);
        } else {
          setCPeople([]);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Load failed";
          toast.error("Company panel", { description: msg });
          setCRecord(null);
          setCPeople([]);
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

  const exportPeople = () => {
    if (cPeople.length === 0) {
      toast.message("No contacts", {
        description: "Load Connectra data first.",
      });
      return;
    }
    const flat = cPeople.map((row) => {
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
    a.download = `company-export-${companyUuid.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported", { description: `${flat.length} contacts` });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && anchor ? (
        <>
          <motion.button
            type="button"
            className="c360-hs-drawer-backdrop"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="c360-hs-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="c360-hs-drawer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <header className="c360-hs-drawer__header">
              <div className="c360-flex c360-items-start c360-gap-3">
                <div className="c360-hs-drawer__avatar" aria-hidden>
                  {hiringSignalInitials(companyName)}
                </div>
                <div className="c360-min-w-0">
                  <h2
                    id="c360-hs-drawer-title"
                    className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                  >
                    {co.name || companyName}
                  </h2>
                  {co.industry ? (
                    <Badge color="info" size="sm" className="c360-mt-2">
                      {co.industry}
                    </Badge>
                  ) : null}
                  <p className="c360-mt-1 c360-font-mono c360-text-2xs c360-text-ink-muted c360-break-all">
                    {companyUuid}
                  </p>
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
                  <span className="c360-font-medium c360-text-ink">
                    Open roles
                  </span>{" "}
                  on this page: {previewJobs.length}
                </p>
                {anchor.companyStaffCount ? (
                  <p className="c360-m-0 c360-text-muted">
                    <span className="c360-font-medium c360-text-ink">
                      Staff (job row)
                    </span>{" "}
                    ~{anchor.companyStaffCount.toLocaleString()}
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

              <section className="c360-mb-4">
                <p className="c360-mb-2 c360-text-2xs c360-font-medium c360-uppercase c360-tracking-wide c360-text-muted">
                  Verified contacts (Connectra)
                </p>
                {loading ? (
                  <p className="c360-text-sm c360-text-muted">Loading…</p>
                ) : cPeople.length === 0 ? (
                  <p className="c360-text-sm c360-text-muted">
                    No contacts returned. Ensure CONNECTRA_* is set on
                    job.server.
                  </p>
                ) : (
                  <ul className="c360-list-none c360-space-y-2" role="list">
                    {cPeople.map((row, i) => {
                      const p = pickContactDisplay(row);
                      const initials = hiringSignalInitials(p.name);
                      return (
                        <li key={connectraContactStableKey(row, i)}>
                          <MediaObject
                            media={
                              <div className="c360-hs-avatar c360-h-10 c360-w-10">
                                {initials}
                              </div>
                            }
                            title={p.name}
                            body={
                              p.title ? (
                                <span className="c360-text-2xs c360-text-muted">
                                  {p.title}
                                </span>
                              ) : null
                            }
                            actions={
                              <div className="c360-flex c360-gap-1">
                                {p.linkedinUrl ? (
                                  <Button
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
                                ) : null}
                                {p.email ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="c360-p-0-5"
                                    asChild
                                  >
                                    <a
                                      href={`mailto:${p.email}`}
                                      aria-label="Email"
                                    >
                                      <Mail size={16} />
                                    </a>
                                  </Button>
                                ) : null}
                              </div>
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            <footer className="c360-hs-drawer__footer">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="c360-gap-1"
                onClick={exportPeople}
                disabled={cPeople.length === 0}
                leftIcon={<Download size={14} />}
              >
                Export signals
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onClose}
              >
                Done
              </Button>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

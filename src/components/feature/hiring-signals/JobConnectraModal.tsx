"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
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
  collectDepartmentOptionsFromContacts,
  proxiedCompanyLogoSrc,
} from "@/components/feature/hiring-signals/hiringSignalUiUtils";
import { HiringSignalAsideDrawer } from "@/components/feature/hiring-signals/HiringSignalAsideDrawer";
import { HiringSignalDrawerContactsGrid } from "@/components/feature/hiring-signals/HiringSignalDrawerContactsGrid";
import { HiringSignalDrawerContactFilters } from "@/components/feature/hiring-signals/HiringSignalDrawerContactFilters";
import type { FilterComboboxOption } from "@/components/ui/FilterCombobox";
import { HiringSignalCompanyWebsiteButton } from "@/components/feature/hiring-signals/HiringSignalCompanyWebsiteButton";
import { HiringSignalCompanyLinkedInButton } from "@/components/feature/hiring-signals/HiringSignalCompanyLinkedInButton";

type ConnectraState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ok";
      company: unknown;
      contacts: unknown[];
      poster: unknown | null;
      total: number;
    };

const DRAWER_CONTACTS_LIMIT = 50;
const BASELINE_CONTACTS_LIMIT = 100;

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
  density?: "comfortable" | "compact";
}

/**
 * job.server read-through: Connectra (sync.server) company + contacts for this job.
 */
export function JobConnectraModal({
  job,
  isOpen,
  onClose,
  density = "comfortable",
}: JobConnectraModalProps) {
  const [state, setState] = useState<ConnectraState>({ kind: "idle" });
  const [selectedContactKeys, setSelectedContactKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [revealedRowIds, setRevealedRowIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [resolvedEmails, setResolvedEmails] = useState<Record<string, string>>(
    () => ({}),
  );
  const [contactTitleFilter, setContactTitleFilter] = useState("");
  const [debouncedTitleFilter, setDebouncedTitleFilter] = useState("");
  const [contactDepartmentsFilter, setContactDepartmentsFilter] = useState<
    string[]
  >([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    FilterComboboxOption[]
  >([]);
  const [contactsReloading, setContactsReloading] = useState(false);
  const initialContactsLoadedRef = useRef(false);

  const onRevealRow = useCallback((rowId: string, email: string) => {
    setRevealedRowIds((prev) => new Set(prev).add(rowId));
    setResolvedEmails((prev) => ({ ...prev, [rowId]: email }));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedContactKeys(new Set());
      setRevealedRowIds(new Set());
      setResolvedEmails({});
      setContactTitleFilter("");
      setDebouncedTitleFilter("");
      setContactDepartmentsFilter([]);
      setDepartmentOptions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedContactKeys(new Set());
    setRevealedRowIds(new Set());
    setResolvedEmails({});
    setContactTitleFilter("");
    setDebouncedTitleFilter("");
    setContactDepartmentsFilter([]);
    setDepartmentOptions([]);
    initialContactsLoadedRef.current = false;
  }, [job.linkedinJobId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedTitleFilter(contactTitleFilter.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [contactTitleFilter]);

  const parseContactsPayload = useCallback((raw: unknown) => {
    const b = parseJobServerJson(raw);
    if (!b.ok) return { ok: false as const, message: b.message };
    const contacts = b.data?.contacts;
    const poster = b.data?.job_poster_contact;
    const contactList = Array.isArray(contacts) ? contacts : [];
    const totalRaw = b.data?.total;
    const total =
      typeof totalRaw === "number" && Number.isFinite(totalRaw)
        ? totalRaw
        : contactList.length;
    return {
      ok: true as const,
      contacts: contactList,
      poster: poster ?? null,
      total,
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !job.linkedinJobId.trim()) return;
    let cancelled = false;
    initialContactsLoadedRef.current = false;
    (async () => {
      setState({ kind: "loading" });
      try {
        const [co, baselineCt, filteredCt] = await Promise.all([
          fetchJobConnectraCompany(job.linkedinJobId),
          fetchJobConnectraContacts(job.linkedinJobId, {
            limit: BASELINE_CONTACTS_LIMIT,
            includePoster: false,
          }),
          fetchJobConnectraContacts(job.linkedinJobId, {
            limit: DRAWER_CONTACTS_LIMIT,
            includePoster: true,
          }),
        ]);
        if (cancelled) return;
        const a = parseJobServerJson(co.hireSignal?.jobConnectraCompany);
        if (!a.ok) {
          setState({ kind: "error", message: a.message });
          return;
        }
        const baseline = parseContactsPayload(
          baselineCt.hireSignal?.jobConnectraContacts,
        );
        const filtered = parseContactsPayload(
          filteredCt.hireSignal?.jobConnectraContacts,
        );
        if (!filtered.ok) {
          setState({ kind: "error", message: filtered.message });
          return;
        }
        if (baseline.ok) {
          setDepartmentOptions(
            collectDepartmentOptionsFromContacts(baseline.contacts).map(
              (d) => ({ value: d, displayValue: d }),
            ),
          );
        }
        const company = a.data?.company;
        setState({
          kind: "ok",
          company: company ?? null,
          contacts: filtered.contacts,
          poster: filtered.poster,
          total: filtered.total,
        });
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Failed to load Connectra data";
        setState({ kind: "error", message: msg });
        toast.error("Connectra (job)", { description: msg });
      } finally {
        if (!cancelled) {
          initialContactsLoadedRef.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, job.linkedinJobId, parseContactsPayload]);

  useEffect(() => {
    if (
      !isOpen ||
      !job.linkedinJobId.trim() ||
      !initialContactsLoadedRef.current
    )
      return;
    let cancelled = false;
    (async () => {
      setContactsReloading(true);
      try {
        const ct = await fetchJobConnectraContacts(job.linkedinJobId, {
          limit: DRAWER_CONTACTS_LIMIT,
          includePoster: true,
          title: debouncedTitleFilter || undefined,
          departments:
            contactDepartmentsFilter.length > 0
              ? contactDepartmentsFilter
              : undefined,
        });
        if (cancelled) return;
        const parsed = parseContactsPayload(
          ct.hireSignal?.jobConnectraContacts,
        );
        if (!parsed.ok) {
          toast.error("Contacts filter", { description: parsed.message });
          return;
        }
        setState((prev) =>
          prev.kind === "ok"
            ? {
                ...prev,
                contacts: parsed.contacts,
                poster: parsed.poster,
                total: parsed.total,
              }
            : prev,
        );
        setSelectedContactKeys(new Set());
      } catch (e) {
        if (!cancelled) {
          toast.error("Contacts filter", {
            description: e instanceof Error ? e.message : "Load failed",
          });
        }
      } finally {
        if (!cancelled) setContactsReloading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    job.linkedinJobId,
    debouncedTitleFilter,
    contactDepartmentsFilter,
    parseContactsPayload,
  ]);

  const clearContactFilters = useCallback(() => {
    setContactTitleFilter("");
    setDebouncedTitleFilter("");
    setContactDepartmentsFilter([]);
  }, []);

  const peopleCountLabel = useCallback(() => {
    if (state.kind !== "ok") return null;
    const shown = state.contacts.length;
    const total = state.total;
    if (total > shown) {
      return ` (${shown} shown of ${total})`;
    }
    return shown ? ` (${shown} shown)` : null;
  }, [state]);

  const companyDisp =
    state.kind === "ok" ? pickCompanyDisplay(state.company) : null;
  const posterDisp =
    state.kind === "ok" && state.poster
      ? pickContactDisplay(state.poster)
      : null;

  const rowNameNorm = job.companyName?.trim().toLowerCase() ?? "";
  const connectraNameNorm = companyDisp?.name?.trim().toLowerCase() ?? "";
  const companyNameMismatch =
    state.kind === "ok" &&
    Boolean(job.companyName?.trim()) &&
    Boolean(companyDisp?.name?.trim()) &&
    rowNameNorm !== connectraNameNorm;

  const companyDisplayName =
    companyDisp?.name || job.companyName?.trim() || "Company";

  const companyLogoMedia = (
    <div className="c360-stat-card__icon c360-flex c360-h-50 c360-w-50 c360-shrink-0 c360-overflow-hidden c360-rounded-full">
      {companyDisp?.profilePic ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote logo URLs from Connectra / scraper
        <img
          src={proxiedCompanyLogoSrc(companyDisp.profilePic)}
          alt=""
          className="c360-h-full c360-w-full c360-object-cover"
        />
      ) : (
        hiringSignalInitials(companyDisplayName)
      )}
    </div>
  );

  const companyMetaBody =
    state.kind === "ok" && state.company ? (
      <div className="c360-hs-drawer__header-meta c360-text-2xs c360-text-ink-muted">
        {companyDisp?.industry ? (
          <p className="c360-text-ink">{companyDisp.industry}</p>
        ) : null}
        {companyDisp?.website ? (
          <HiringSignalCompanyWebsiteButton website={companyDisp.website} />
        ) : null}
        {companyDisp?.employees ? (
          <p>~{companyDisp.employees} employees</p>
        ) : null}
        {companyDisp?.linkedinUrl ? (
          <HiringSignalCompanyLinkedInButton
            linkedinUrl={companyDisp.linkedinUrl}
          />
        ) : null}
      </div>
    ) : null;

  const exportContactsCsv = () => {
    if (state.kind !== "ok" || state.contacts.length === 0) {
      toast.message("Nothing to export", {
        description: "No contacts returned for this job.",
      });
      return;
    }
    const rowsToExport =
      selectedContactKeys.size > 0
        ? state.contacts.filter((row, i) =>
            selectedContactKeys.has(connectraContactStableKey(row, i)),
          )
        : state.contacts;
    if (rowsToExport.length === 0) {
      toast.message("Nothing to export", {
        description: "No contacts match your selection.",
      });
      return;
    }
    const flat = rowsToExport.map((row) => {
      const p = pickContactDisplay(row);
      const idx = state.contacts.indexOf(row);
      const stableKey = connectraContactStableKey(row, idx >= 0 ? idx : 0);
      const email = resolvedEmails[stableKey] ?? p.email;
      return {
        name: p.name,
        title: p.title,
        email,
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
        <div className="c360-min-w-0 c360-flex-1">
          {state.kind === "ok" && state.company ? (
            <MediaObject
              className="c360-hs-drawer__header-company"
              media={companyLogoMedia}
              title={
                <h2
                  id="c360-hs-job-connectra-title"
                  className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                >
                  {companyDisplayName}
                </h2>
              }
              body={companyMetaBody}
            />
          ) : state.kind === "loading" || state.kind === "idle" ? (
            <MediaObject
              className="c360-hs-drawer__header-company"
              media={
                <div className="c360-stat-card__icon c360-flex c360-h-50 c360-w-50 c360-shrink-0 c360-items-center c360-justify-center c360-overflow-hidden c360-rounded-full c360-bg-ink-1">
                  {hiringSignalInitials(job.companyName || "C")}
                </div>
              }
              title={
                <h2
                  id="c360-hs-job-connectra-title"
                  className="c360-m-0 c360-text-lg c360-font-semibold c360-text-ink"
                >
                  {job.companyName?.trim() || "Company"}
                </h2>
              }
              body={
                <p className="c360-m-0 c360-flex c360-items-center c360-gap-2 c360-text-2xs c360-text-ink-muted">
                  <Loader2
                    className="c360-animate-spin"
                    size={14}
                    aria-hidden
                  />
                  Loading from Connectra…
                </p>
              }
            />
          ) : (
            <h2
              id="c360-hs-job-connectra-title"
              className="c360-m-0 c360-min-w-0 c360-text-lg c360-font-semibold c360-text-ink"
            >
              {job.companyName?.trim() || "Connectra for this role"}
            </h2>
          )}
          {state.kind === "ok" && !state.company ? (
            <p className="c360-mt-2 c360-text-2xs c360-text-ink-muted">
              No company record. The job may need a completed Connectra company
              sync (set CONNECTRA on job.server and re-run the scrape pipeline).
            </p>
          ) : null}
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
        {companyNameMismatch ? (
          <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
            Hiring table showed “{job.companyName}”; Connectra company name is
            canonical above.
          </p>
        ) : null}

        {state.kind === "loading" || state.kind === "idle" ? (
          <div className="c360-space-y-3 c360-py-4" aria-busy>
            <div className="c360-skeleton c360-skeleton--w-full c360-skeleton--h-72" />
            <div className="c360-skeleton c360-skeleton--w-full c360-skeleton--h-96" />
            <div className="c360-skeleton c360-skeleton--w-full c360-skeleton--h-140" />
          </div>
        ) : null}

        {state.kind === "error" ? (
          <p
            className="c360-py-4 c360-text-sm c360-text-ink-muted"
            role="alert"
          >
            {state.message}
          </p>
        ) : null}

        {state.kind === "ok" ? (
          <div className="c360-space-y-4">
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
              <div className="c360-hs-drawer__section-toolbar c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
                <h3
                  id="c360-connectra-people"
                  className="c360-m-0 c360-flex c360-items-center c360-gap-2 c360-text-sm c360-font-medium c360-text-ink"
                >
                  <Users size={16} aria-hidden />
                  People at this company
                  {peopleCountLabel()}
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
              <HiringSignalDrawerContactFilters
                titleFilter={contactTitleFilter}
                onTitleFilterChange={setContactTitleFilter}
                departmentOptions={departmentOptions}
                selectedDepartments={contactDepartmentsFilter}
                onDepartmentsChange={setContactDepartmentsFilter}
                onClear={clearContactFilters}
                disabled={contactsReloading}
              />
              {state.contacts.length === 0 && !contactsReloading ? (
                <p className="c360-text-2xs c360-text-ink-muted">
                  No contacts indexed in Connectra for this job&apos;s{" "}
                  <span className="c360-font-mono">company_uuid</span>. Export
                  and indexing jobs may still be pending, or this company has no
                  contact documents yet.
                </p>
              ) : (
                <HiringSignalDrawerContactsGrid
                  contacts={state.contacts}
                  loading={contactsReloading}
                  density={density}
                  selectedKeys={selectedContactKeys}
                  onSelectionChange={setSelectedContactKeys}
                  scrollClassName={modalTableShellScrollClass}
                  companyWebsite={companyDisp?.website ?? ""}
                  resolvedEmails={resolvedEmails}
                  revealedRowIds={revealedRowIds}
                  onRevealRow={onRevealRow}
                />
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

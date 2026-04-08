"use client";

import { Fragment, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Popover } from "@/components/ui/Popover";
import { ContactDetailPanel } from "@/components/feature/contacts/ContactDetailPanel";
import { contactDetailRoute } from "@/lib/routes";
import { cn, getAvatarUrl } from "@/lib/utils";
import { mapConnectraError } from "@/lib/linkedinValidation";
import type { Contact } from "@/services/graphql/contactsService";

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

function hashContactRef(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++)
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  const n = (Math.abs(h) % 90000) + 10000;
  return `#C-${n}`;
}

function formatCheckInDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
}

type StatusTone = "danger" | "warning" | "success" | "primary" | "muted";

function emailStatusTone(status?: string): StatusTone {
  const s = (status || "").toUpperCase();
  if (s === "VALID") return "success";
  if (s === "FOUND") return "primary";
  if (s === "RISKY") return "danger";
  if (s === "UNKNOWN") return "warning";
  return "muted";
}

function emailStatusLabel(status?: string): string {
  const s = (status || "").toUpperCase();
  if (s === "VALID") return "Verified";
  if (s === "FOUND") return "Found";
  if (s === "RISKY") return "Risky";
  if (s === "UNKNOWN") return "Unknown";
  if (!status) return "No email";
  return status;
}

function SortCaret({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <span className="c360-jobs-dt__sort-carets" aria-hidden>
      <span
        className={cn(
          "c360-jobs-dt__sort-caret",
          active && dir === "asc" && "c360-jobs-dt__sort-caret--on",
        )}
      >
        ▲
      </span>
      <span
        className={cn(
          "c360-jobs-dt__sort-caret",
          active && dir === "desc" && "c360-jobs-dt__sort-caret--on",
        )}
      >
        ▼
      </span>
    </span>
  );
}

export interface ContactsDataTableProps {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selected: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAllPage: () => void;
  expandedRow: string | null;
  onToggleExpand: (id: string) => void;
  onRetry?: () => void;
}

export function ContactsDataTable({
  contacts,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
  error,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  selected,
  onToggleSelect,
  onToggleSelectAllPage,
  expandedRow,
  onToggleExpand,
  onRetry,
}: ContactsDataTableProps) {
  const allPageSelected =
    contacts.length > 0 && contacts.every((c) => selected.includes(c.id));
  const somePageSelected =
    contacts.some((c) => selected.includes(c.id)) && !allPageSelected;

  const dateSortDir: "asc" | "desc" = sortBy === "oldest" ? "asc" : "desc";
  const nameSortDir: "asc" | "desc" = sortBy === "name_desc" ? "desc" : "asc";

  const toggleDateSort = useCallback(() => {
    onSortChange(sortBy === "oldest" ? "newest" : "oldest");
  }, [sortBy, onSortChange]);

  const toggleNameSort = useCallback(() => {
    onSortChange(sortBy === "name_asc" ? "name_desc" : "name_asc");
  }, [sortBy, onSortChange]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const showingFrom = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingTo = total === 0 ? 0 : Math.min(safePage * pageSize, total);

  const errorMsg = useMemo(
    () => (error ? mapConnectraError(error) : null),
    [error],
  );

  return (
    <div className="c360-jobs-dt c360-jobs-dt--contacts">
      <div className="c360-jobs-dt__toolbar">
        <div className="c360-jobs-dt__toolbar-left">
          <span className="c360-jobs-dt__toolbar-label">Show</span>
          <Select
            options={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            fullWidth={false}
            className="c360-jobs-dt__page-size"
          />
          <span className="c360-jobs-dt__toolbar-label">entries</span>
        </div>
        <div className="c360-jobs-dt__toolbar-right">
          <span className="c360-jobs-dt__toolbar-label">Search:</span>
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter by email, name…"
            className="c360-jobs-dt__search"
          />
        </div>
      </div>

      <div className="c360-jobs-dt__scroll">
        <table className="c360-jobs-dt__table">
          <thead>
            <tr>
              <th className="c360-jobs-dt__th--checkbox">
                <Checkbox
                  size="sm"
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={() => onToggleSelectAllPage()}
                  aria-label="Select all on this page"
                />
              </th>
              <th className="c360-jobs-dt__th--narrow" aria-hidden />
              <th>Contact ref</th>
              <th>
                <button
                  type="button"
                  className="c360-jobs-dt__th-btn"
                  onClick={toggleDateSort}
                >
                  Added
                  <SortCaret
                    active={sortBy === "newest" || sortBy === "oldest"}
                    dir={dateSortDir}
                  />
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="c360-jobs-dt__th-btn"
                  onClick={toggleNameSort}
                >
                  Name
                  <SortCaret
                    active={sortBy === "name_asc" || sortBy === "name_desc"}
                    dir={nameSortDir}
                  />
                </button>
              </th>
              <th>Title</th>
              <th>Region</th>
              <th>Status</th>
              <th>Company</th>
              <th>Email</th>
              <th className="c360-jobs-dt__th--action">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && contacts.length === 0 ? (
              <tr>
                <td colSpan={11} className="c360-jobs-dt__loading">
                  <Loader2 size={20} className="c360-spin" />
                  <span>Loading contacts…</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={11}
                  className="c360-jobs-dt__empty c360-text-danger"
                >
                  {errorMsg}
                  {onRetry ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="c360-ml-2"
                      disabled={loading}
                      onClick={onRetry}
                    >
                      Retry
                    </Button>
                  ) : null}
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={11} className="c360-jobs-dt__empty">
                  No contacts found
                </td>
              </tr>
            ) : (
              contacts.map((contact, rowIndex) => {
                const expanded = expandedRow === contact.id;
                const tone = emailStatusTone(contact.emailStatus);
                return (
                  <Fragment key={contact.id}>
                    <tr
                      className={cn(
                        "c360-jobs-dt__row",
                        rowIndex % 2 === 1 && "c360-jobs-dt__row--alt",
                        expanded && "c360-jobs-dt__row--expanded",
                      )}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          size="sm"
                          checked={selected.includes(contact.id)}
                          onChange={() => onToggleSelect(contact.id)}
                          aria-label={`Select ${contact.name}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="c360-jobs-dt__expand"
                          aria-expanded={expanded}
                          aria-label={
                            expanded ? "Collapse details" : "Expand details"
                          }
                          onClick={() => onToggleExpand(contact.id)}
                        >
                          {expanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </td>
                      <td>
                        <strong className="c360-jobs-dt__job-ref">
                          {hashContactRef(contact.id)}
                        </strong>
                      </td>
                      <td className="c360-jobs-dt__muted">
                        {formatCheckInDate(contact.createdAt)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="c360-contacts-dt__name-btn"
                          onClick={() => onToggleExpand(contact.id)}
                        >
                          <Image
                            src={getAvatarUrl(contact.name, 32)}
                            alt=""
                            width={32}
                            height={32}
                            className="c360-contact-avatar"
                          />
                          <span className="c360-jobs-dt__task-link c360-text-left">
                            {contact.name}
                          </span>
                        </button>
                      </td>
                      <td className="c360-jobs-dt__muted">
                        {contact.title || "—"}
                      </td>
                      <td
                        className="c360-jobs-dt__muted c360-contacts-dt__truncate"
                        title={contact.location || contact.country || ""}
                      >
                        {contact.location || contact.country || "—"}
                      </td>
                      <td>
                        <span
                          className={cn(
                            "c360-jobs-dt__pill",
                            `c360-jobs-dt__pill--${tone}`,
                          )}
                        >
                          <span
                            className="c360-jobs-dt__pill-dot"
                            aria-hidden
                          />
                          {emailStatusLabel(contact.emailStatus)}
                        </span>
                      </td>
                      <td
                        className="c360-jobs-dt__muted c360-contacts-dt__truncate"
                        title={contact.company || ""}
                      >
                        {contact.company || "—"}
                      </td>
                      <td
                        className="c360-contacts-dt__email c360-text-xs"
                        title={contact.email || ""}
                      >
                        {contact.email || "—"}
                      </td>
                      <td className="c360-jobs-dt__action-cell">
                        <Popover
                          align="end"
                          width={200}
                          trigger={
                            <button
                              type="button"
                              className="c360-jobs-dt__action-btn"
                              aria-label={`Actions for ${contact.name}`}
                            >
                              <MoreHorizontal size={20} />
                            </button>
                          }
                          content={
                            <div className="c360-jobs-dt__menu">
                              <Link
                                href={contactDetailRoute(contact.id)}
                                className="c360-jobs-dt__menu-link"
                              >
                                <ExternalLink size={14} aria-hidden />
                                View profile
                              </Link>
                              <button
                                type="button"
                                className="c360-jobs-dt__menu-item"
                                onClick={() => onToggleExpand(contact.id)}
                              >
                                {expanded ? "Hide details" : "View details"}
                              </button>
                              {contact.email ? (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="c360-jobs-dt__menu-link"
                                >
                                  <Mail size={14} aria-hidden />
                                  Compose email
                                </a>
                              ) : null}
                            </div>
                          }
                        />
                      </td>
                    </tr>
                    {expanded && (
                      <ContactDetailPanel contact={contact} colSpan={11} />
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="c360-jobs-dt__footer">
        <p className="c360-jobs-dt__footer-text">
          Showing {showingFrom} to {showingTo} of {total} entries
        </p>
        <div className="c360-jobs-dt__pager">
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Previous
          </Button>
          <span className="c360-jobs-dt__footer-text">
            Page {safePage} of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={safePage >= pageCount}
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

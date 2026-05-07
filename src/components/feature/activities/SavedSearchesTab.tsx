"use client";

import Link from "next/link";
import { Bookmark, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { ROUTES } from "@/lib/routes";
import { formatDate } from "@/lib/utils";

function typeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t === "contact") return "Contacts";
  if (t === "company") return "Companies";
  if (t === "hire_signal") return "Hiring signals";
  if (t === "all") return "All";
  return type;
}

function targetHref(type: string): string {
  const t = type.toLowerCase();
  if (t === "contact") return ROUTES.CONTACTS;
  if (t === "company") return ROUTES.COMPANIES;
  if (t === "hire_signal") return ROUTES.HIRING_SIGNALS;
  return ROUTES.CONTACTS;
}

function badgeColor(type: string): BadgeColor {
  const t = type.toLowerCase();
  if (t === "contact") return "blue";
  if (t === "company") return "green";
  if (t === "hire_signal") return "purple";
  return "gray";
}

export function SavedSearchesTab() {
  const { searches, loading, refresh } = useSavedSearches();

  if (loading) {
    return (
      <Card>
        <div className="c360-card-body">
          <p className="c360-text-sm c360-text-muted c360-m-0">Loading…</p>
        </div>
      </Card>
    );
  }

  if (searches.length === 0) {
    return (
      <Card>
        <div className="c360-card-body">
          <p className="c360-text-sm c360-text-muted c360-m-0">
            No saved searches yet. Save a view from Contacts, Companies, or
            Hiring signals using the &ldquo;Saved&rdquo; control in the filter
            rail.
          </p>
        </div>
      </Card>
    );
  }

  const sorted = [...searches].sort((a, b) => {
    const ta = new Date(a.updatedAt ?? a.createdAt).getTime();
    const tb = new Date(b.updatedAt ?? b.createdAt).getTime();
    return tb - ta;
  });

  return (
    <div className="c360-section-stack">
      <div className="c360-flex c360-flex-wrap c360-items-center c360-justify-between c360-gap-2">
        <p className="c360-text-sm c360-text-muted c360-m-0">
          {sorted.length} saved search{sorted.length === 1 ? "" : "es"} (your
          account)
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
        >
          Refresh
        </Button>
      </div>

      <Card padding="none">
        <div className="c360-table-wrapper">
          <table className="c360-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Uses</th>
                <th>Last used</th>
                <th aria-label="Open list" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id}>
                  <td className="c360-font-medium">{s.name}</td>
                  <td>
                    <Badge color={badgeColor(s.type)}>
                      {typeLabel(s.type)}
                    </Badge>
                  </td>
                  <td className="c360-text-muted">{s.useCount}</td>
                  <td className="c360-text-muted">
                    {s.lastUsedAt ? formatDate(s.lastUsedAt) : "—"}
                  </td>
                  <td className="c360-text-right">
                    <Link href={targetHref(s.type)}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        rightIcon={<ExternalLink size={14} />}
                      >
                        Open
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="c360-text-xs c360-text-muted c360-m-0 c360-flex c360-items-center c360-gap-1">
        <Bookmark size={12} aria-hidden />
        Apply a saved view from the list page using &ldquo;Saved&rdquo; → pick a
        name.
      </p>
    </div>
  );
}

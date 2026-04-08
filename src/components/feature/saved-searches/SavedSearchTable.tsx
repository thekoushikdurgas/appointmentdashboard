"use client";

import { Bookmark, Plus, Edit2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { type SavedSearch } from "@/services/graphql/savedSearchesService";
import { formatRelativeTime } from "@/lib/utils";

const TYPE_COLORS: Record<
  string,
  "blue" | "green" | "yellow" | "red" | "gray"
> = {
  contact: "blue",
  company: "green",
  all: "yellow",
};

interface SavedSearchTableProps {
  searches: SavedSearch[];
  loading: boolean;
  onNew: () => void;
  onEdit: (s: SavedSearch) => void;
  onDelete: (id: string) => void;
}

export function SavedSearchTable({
  searches,
  loading,
  onNew,
  onEdit,
  onDelete,
}: SavedSearchTableProps) {
  return (
    <Card>
      {loading ? (
        <p className="c360-page-subtitle c360-p-4">Loading…</p>
      ) : searches.length === 0 ? (
        <div className="c360-empty-state">
          <Bookmark size={40} className="c360-mb-4 c360-opacity-30" />
          <p>No saved searches yet.</p>
          <Button
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={onNew}
            className="c360-mt-2"
          >
            Create one
          </Button>
        </div>
      ) : (
        <div className="c360-table-wrapper">
          <table className="c360-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Search term</th>
                <th>Uses</th>
                <th>Last used</th>
                <th>Created</th>
                <th className="c360-table__th--saved-actions" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {searches.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="c360-text-sm c360-fw-medium">{s.name}</div>
                    {s.description && (
                      <div className="c360-text-xs c360-text-muted">
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge
                      color={TYPE_COLORS[s.type] ?? "gray"}
                      className="c360-text-xs"
                    >
                      {s.type}
                    </Badge>
                  </td>
                  <td className="c360-text-sm c360-text-muted">
                    {s.searchTerm ?? "—"}
                  </td>
                  <td className="c360-text-sm">{s.useCount}</td>
                  <td className="c360-text-sm c360-text-muted">
                    {s.lastUsedAt ? formatRelativeTime(s.lastUsedAt) : "Never"}
                  </td>
                  <td className="c360-text-sm c360-text-muted">
                    {formatRelativeTime(s.createdAt)}
                  </td>
                  <td>
                    <div className="c360-badge-row c360-gap-1">
                      <button
                        title="Edit"
                        onClick={() => onEdit(s)}
                        className="c360-icon-btn"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => onDelete(s.id)}
                        className="c360-icon-btn c360-icon-btn--danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

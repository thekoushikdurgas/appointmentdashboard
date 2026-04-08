"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/patterns/Pagination";
import { Badge } from "@/components/ui/Badge";
import type { UserHistoryItem } from "@/graphql/generated/types";
import { formatRelativeTime } from "@/lib/utils";

const EVENT_OPTIONS = [
  { value: "", label: "All events" },
  { value: "login", label: "Login" },
  { value: "register", label: "Register" },
  { value: "logout", label: "Logout" },
];

interface AdminHistoryTabProps {
  items: UserHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  userIdFilter: string;
  eventType: string;
  loading: boolean;
  onUserIdFilterChange: (v: string) => void;
  onEventTypeChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onApply: () => void;
}

export function AdminHistoryTab({
  items,
  total,
  page,
  pageSize,
  userIdFilter,
  eventType,
  loading,
  onUserIdFilterChange,
  onEventTypeChange,
  onPageChange,
  onApply,
}: AdminHistoryTabProps) {
  return (
    <Card
      title="User history"
      subtitle="SuperAdmin — admin.userHistory(filters)"
      actions={
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={() => onApply()}
        >
          Apply filters
        </Button>
      }
    >
      <div className="c360-flex c360-flex-wrap c360-gap-3 c360-mb-4">
        <div className="c360-admin-history-filter-field--user">
          <Input
            label="User ID"
            value={userIdFilter}
            onChange={(e) => onUserIdFilterChange(e.target.value)}
            placeholder="UUID (optional)"
            inputSize="sm"
          />
        </div>
        <div className="c360-admin-history-filter-field--event">
          <Select
            label="Event type"
            options={EVENT_OPTIONS}
            value={eventType}
            onChange={(e) => onEventTypeChange(e.target.value)}
            inputSize="sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="c360-page-subtitle">Loading history…</p>
      ) : items.length === 0 ? (
        <p className="c360-page-subtitle">
          No history rows. Filter by user ID for best results.
        </p>
      ) : (
        <>
          <div className="c360-table-wrapper">
            <table className="c360-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>Location</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id}>
                    <td className="c360-text-xs c360-text-muted">
                      {formatRelativeTime(row.createdAt)}
                    </td>
                    <td>
                      <Badge color="gray" className="c360-text-xs">
                        {row.eventType}
                      </Badge>
                    </td>
                    <td className="c360-text-sm">
                      <div>{row.userEmail ?? row.userId}</div>
                      {row.userName && (
                        <div className="c360-text-xs c360-text-muted">
                          {row.userName}
                        </div>
                      )}
                    </td>
                    <td className="c360-text-xs c360-text-muted">
                      {[row.city, row.country, row.continent]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="c360-text-xs c360-text-muted">
                      {row.device ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="c360-table-footer">
            <Pagination
              page={page}
              total={total}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}
    </Card>
  );
}

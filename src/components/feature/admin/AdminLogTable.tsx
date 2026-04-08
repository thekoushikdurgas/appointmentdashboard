"use client";

import { Fragment, useState } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/patterns/Pagination";
import { type LogEntry } from "@/services/graphql/adminService";

const LEVEL_OPTIONS = [
  { value: "", label: "All levels" },
  { value: "ERROR", label: "ERROR" },
  { value: "WARN", label: "WARN" },
  { value: "INFO", label: "INFO" },
  { value: "DEBUG", label: "DEBUG" },
];

interface AdminLogTableProps {
  logs: LogEntry[];
  loading: boolean;
  logSearch: string;
  onLogSearchChange: (v: string) => void;
  onSearch: () => void;
  level: string;
  logger: string;
  userId: string;
  startTime: string;
  endTime: string;
  onLevelChange: (v: string) => void;
  onLoggerChange: (v: string) => void;
  onUserIdChange: (v: string) => void;
  onStartTimeChange: (v: string) => void;
  onEndTimeChange: (v: string) => void;
  onApplyFilters: () => void;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}

function jsonPreview(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AdminLogTable({
  logs,
  loading,
  logSearch,
  onLogSearchChange,
  onSearch,
  level,
  logger,
  userId,
  startTime,
  endTime,
  onLevelChange,
  onLoggerChange,
  onUserIdChange,
  onStartTimeChange,
  onEndTimeChange,
  onApplyFilters,
  total,
  page,
  pageSize,
  onPageChange,
}: AdminLogTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card
      title="System logs"
      subtitle="SuperAdmin — admin.logs(filters) or searchLogs(input)"
      actions={
        <div className="c360-badge-row">
          <Input
            value={logSearch}
            onChange={(e) => onLogSearchChange(e.target.value)}
            placeholder="Full-text search…"
            className="c360-admin-log-search"
            inputSize="sm"
          />
          <Button variant="secondary" size="sm" onClick={onSearch}>
            <Search size={14} />
          </Button>
        </div>
      }
    >
      <div className="c360-flex c360-flex-wrap c360-gap-3 c360-mb-4">
        <div className="c360-admin-log-filter-field--level">
          <Select
            label="Level"
            options={LEVEL_OPTIONS}
            value={level}
            onChange={(e) => onLevelChange(e.target.value)}
            inputSize="sm"
          />
        </div>
        <div className="c360-admin-log-filter-field--logger">
          <Input
            label="Logger"
            value={logger}
            onChange={(e) => onLoggerChange(e.target.value)}
            placeholder="e.g. api"
            inputSize="sm"
          />
        </div>
        <div className="c360-admin-log-filter-field--wide">
          <Input
            label="User ID"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            inputSize="sm"
          />
        </div>
        <div className="c360-admin-log-filter-field--wide">
          <Input
            label="Start (local)"
            type="datetime-local"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            inputSize="sm"
          />
        </div>
        <div className="c360-admin-log-filter-field--wide">
          <Input
            label="End (local)"
            type="datetime-local"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            inputSize="sm"
          />
        </div>
        <div className="c360-flex c360-items-end">
          <Button size="sm" variant="secondary" onClick={onApplyFilters}>
            Apply filters
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="c360-page-subtitle">Loading logs…</p>
      ) : logs.length === 0 ? (
        <p className="c360-page-subtitle c360-text-center c360-py-8">
          No logs found.
        </p>
      ) : (
        <>
          <div className="c360-table-wrapper">
            <table className="c360-table">
              <thead>
                <tr>
                  <th className="c360-table__th--expand" aria-label="Expand" />
                  <th>Time</th>
                  <th>Level</th>
                  <th>Logger</th>
                  <th>User</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const open = expanded === log.id;
                  const detail =
                    jsonPreview(log.context) || jsonPreview(log.error);
                  return (
                    <Fragment key={log.id}>
                      <tr>
                        <td>
                          {detail ? (
                            <button
                              type="button"
                              className="c360-btn c360-btn--ghost c360-btn--sm"
                              aria-expanded={open ? "true" : "false"}
                              onClick={() => setExpanded(open ? null : log.id)}
                            >
                              {open ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          ) : null}
                        </td>
                        <td className="c360-text-xs c360-text-muted">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          <Badge
                            color={
                              log.level === "ERROR"
                                ? "red"
                                : log.level === "WARN"
                                  ? "orange"
                                  : "gray"
                            }
                            className="c360-text-xs"
                          >
                            {log.level}
                          </Badge>
                        </td>
                        <td className="c360-text-sm c360-text-muted">
                          {log.logger || "—"}
                        </td>
                        <td className="c360-text-xs c360-text-muted">
                          {log.userId ?? "—"}
                        </td>
                        <td className="c360-text-sm">{log.message}</td>
                      </tr>
                      {open && detail ? (
                        <tr>
                          <td colSpan={6}>
                            <pre className="c360-text-xs c360-p-3 c360-admin-log-detail-pre">
                              {detail}
                            </pre>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
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

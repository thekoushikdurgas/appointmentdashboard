"use client";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

const SERVICE_OPTIONS = [
  { value: "", label: "All services" },
  { value: "contacts", label: "Contacts" },
  { value: "companies", label: "Companies" },
  { value: "email", label: "Email" },
  { value: "ai_chats", label: "AI chats" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "sales_navigator", label: "Sales Navigator" },
  { value: "jobs", label: "Jobs" },
  { value: "imports", label: "Imports" },
];

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "query", label: "Query" },
  { value: "search", label: "Search" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
  { value: "send", label: "Send" },
  { value: "verify", label: "Verify" },
  { value: "analyze", label: "Analyze" },
  { value: "generate", label: "Generate" },
  { value: "parse", label: "Parse" },
  { value: "scrape", label: "Scrape" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "partial", label: "Partial" },
];

export interface ActivityFiltersBarValues {
  serviceType: string;
  actionType: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface ActivityFiltersBarProps {
  values: ActivityFiltersBarValues;
  onChange: (next: ActivityFiltersBarValues) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ActivityFiltersBar({
  values,
  onChange,
  onClear,
  disabled,
}: ActivityFiltersBarProps) {
  const patch = (partial: Partial<ActivityFiltersBarValues>) =>
    onChange({ ...values, ...partial });

  return (
    <div className="c360-card c360-p-4 c360-mb-4">
      <p className="c360-text-sm c360-text-muted c360-mb-3">Filters</p>
      <div className="c360-filter-bar--facets">
        <div className="c360-activity-filter-field--select">
          <Select
            label="Service"
            options={SERVICE_OPTIONS}
            value={values.serviceType}
            onChange={(e) => patch({ serviceType: e.target.value })}
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div className="c360-activity-filter-field--select">
          <Select
            label="Action"
            options={ACTION_OPTIONS}
            value={values.actionType}
            onChange={(e) => patch({ actionType: e.target.value })}
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div className="c360-activity-filter-field--status">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) => patch({ status: e.target.value })}
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div className="c360-activity-filter-field--date">
          <Input
            label="Start (local)"
            type="datetime-local"
            value={values.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div className="c360-activity-filter-field--date">
          <Input
            label="End (local)"
            type="datetime-local"
            value={values.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div className="c360-flex c360-items-end c360-gap-2 c360-flex-shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const end = new Date();
              const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
              const toLocal = (d: Date) => {
                const pad = (n: number) => String(n).padStart(2, "0");
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              };
              patch({ startDate: toLocal(start), endDate: toLocal(end) });
            }}
            disabled={disabled}
          >
            Last 24h
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={disabled}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}

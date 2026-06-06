"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export const ACTIVITY_SERVICE_OPTIONS = [
  { value: "", label: "All services" },
  { value: "contacts", label: "Contacts" },
  { value: "companies", label: "Companies" },
  { value: "email", label: "Email" },
  { value: "ai_chats", label: "AI chats" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "sales_navigator", label: "Sales Navigator" },
  { value: "jobs", label: "Jobs" },
  { value: "imports", label: "Imports" },
  { value: "auth", label: "Auth" },
  { value: "billing", label: "Billing" },
  { value: "profile", label: "Profile" },
  { value: "phone", label: "Phone" },
  { value: "hire_signal", label: "Hiring signals" },
  { value: "campaigns", label: "Campaigns" },
  { value: "saved_searches", label: "Saved searches" },
  { value: "notifications", label: "Notifications" },
  { value: "navigation", label: "Navigation" },
  { value: "files", label: "Files" },
  { value: "resume", label: "Resume" },
];

export const ACTIVITY_ACTION_OPTIONS = [
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
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "register", label: "Register" },
  { value: "view", label: "View" },
  { value: "subscribe", label: "Subscribe" },
  { value: "reset_password", label: "Reset password" },
  { value: "enable_2fa", label: "Enable 2FA" },
  { value: "apply", label: "Apply" },
  { value: "download", label: "Download" },
];

export const ACTIVITY_STATUS_OPTIONS = [
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

export function activityLast24hDateRange(): Pick<
  ActivityFiltersBarValues,
  "startDate" | "endDate"
> {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { startDate: toLocal(start), endDate: toLocal(end) };
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
    <div
      className={cn("c360-card c360-activity-filters-bar c360-p-4 c360-mb-4")}
      role="region"
      aria-label="Activity filters"
    >
      <p className="c360-text-sm c360-text-muted c360-mb-3">Filters</p>
      <div className="c360-filter-bar--facets">
        <div className="c360-activity-filter-field--select">
          <Select
            label="Service"
            options={ACTIVITY_SERVICE_OPTIONS}
            value={values.serviceType}
            onChange={(e) => patch({ serviceType: e.target.value })}
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div className="c360-activity-filter-field--select">
          <Select
            label="Action"
            options={ACTIVITY_ACTION_OPTIONS}
            value={values.actionType}
            onChange={(e) => patch({ actionType: e.target.value })}
            disabled={disabled}
            inputSize="sm"
          />
        </div>
        <div className="c360-activity-filter-field--status">
          <Select
            label="Status"
            options={ACTIVITY_STATUS_OPTIONS}
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
            onClick={() => patch(activityLast24hDateRange())}
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

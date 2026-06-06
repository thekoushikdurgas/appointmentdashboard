"use client";

import { useCallback, useMemo } from "react";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { FilterSidebarBody } from "@/components/layouts/FilterSidebarBody";
import { FilterSidebarHeader } from "@/components/layouts/FilterSidebarHeader";
import {
  ACTIVITY_ACTION_OPTIONS,
  ACTIVITY_SERVICE_OPTIONS,
  ACTIVITY_STATUS_OPTIONS,
  activityLast24hDateRange,
  type ActivityFiltersBarValues,
} from "@/components/feature/activities/ActivityFiltersBar";

function optionLabel(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function formatDateChip(raw: string): string {
  return raw.replace("T", " ").slice(0, 16);
}

export interface ActivitiesFilterSidebarProps {
  values: ActivityFiltersBarValues;
  onChange: (next: ActivityFiltersBarValues) => void;
  onClear: () => void;
  disabled?: boolean;
  filterDrawerTitleId?: string;
}

export function ActivitiesFilterSidebar({
  values,
  onChange,
  onClear,
  disabled,
  filterDrawerTitleId = "c360-activities-filter-drawer-title",
}: ActivitiesFilterSidebarProps) {
  const patch = useCallback(
    (partial: Partial<ActivityFiltersBarValues>) =>
      onChange({ ...values, ...partial }),
    [onChange, values],
  );

  const serviceActive = values.serviceType.trim() !== "";
  const actionActive = values.actionType.trim() !== "";
  const statusActive = values.status.trim() !== "";
  const dateActive = Boolean(values.startDate || values.endDate);

  const totalActiveCount = useMemo(() => {
    let n = 0;
    if (serviceActive) n += 1;
    if (actionActive) n += 1;
    if (statusActive) n += 1;
    if (dateActive) n += 1;
    return n;
  }, [serviceActive, actionActive, statusActive, dateActive]);

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (serviceActive) {
      out.push({
        key: "service",
        label: `Service: ${optionLabel(ACTIVITY_SERVICE_OPTIONS, values.serviceType)}`,
        onRemove: () => patch({ serviceType: "" }),
      });
    }
    if (actionActive) {
      out.push({
        key: "action",
        label: `Action: ${optionLabel(ACTIVITY_ACTION_OPTIONS, values.actionType)}`,
        onRemove: () => patch({ actionType: "" }),
      });
    }
    if (statusActive) {
      out.push({
        key: "status",
        label: `Status: ${optionLabel(ACTIVITY_STATUS_OPTIONS, values.status)}`,
        onRemove: () => patch({ status: "" }),
      });
    }
    if (dateActive) {
      const start = values.startDate ? formatDateChip(values.startDate) : "…";
      const end = values.endDate ? formatDateChip(values.endDate) : "…";
      out.push({
        key: "dates",
        label: `Date: ${start} → ${end}`,
        onRemove: () => patch({ startDate: "", endDate: "" }),
      });
    }
    return out;
  }, [
    serviceActive,
    actionActive,
    statusActive,
    dateActive,
    values.serviceType,
    values.actionType,
    values.status,
    values.startDate,
    values.endDate,
    patch,
  ]);

  return (
    <div className={cn("c360-contacts-filters", "c360-activities-filters")}>
      <FilterSidebarHeader
        titleId={filterDrawerTitleId}
        activeCount={totalActiveCount}
        onClear={onClear}
        clearLabel="Clear"
        showClear={totalActiveCount > 0 && !disabled}
      />

      <FilterSidebarBody>
        {chips.length > 0 ? (
          <div
            className="c360-contacts-filters__chips"
            aria-label="Active filters"
          >
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                className="c360-contacts-filters__chip"
                title="Remove filter"
                onClick={c.onRemove}
              >
                <span>{c.label}</span>
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="c360-contacts-filters__columns-inner">
          <ContactsCollapsibleFilterSection
            title="Service"
            count={serviceActive ? 1 : 0}
            defaultOpen
            onClear={
              serviceActive ? () => patch({ serviceType: "" }) : undefined
            }
          >
            <div className="c360-activity-filter-field--select">
              <Select
                label="Service"
                options={ACTIVITY_SERVICE_OPTIONS}
                value={values.serviceType}
                onChange={(e) => patch({ serviceType: e.target.value })}
                disabled={disabled}
                fullWidth
                inputSize="md"
                menuVariant="inline"
              />
            </div>
          </ContactsCollapsibleFilterSection>

          <ContactsCollapsibleFilterSection
            title="Action"
            count={actionActive ? 1 : 0}
            defaultOpen={actionActive}
            onClear={actionActive ? () => patch({ actionType: "" }) : undefined}
          >
            <div className="c360-activity-filter-field--select">
              <Select
                label="Action"
                options={ACTIVITY_ACTION_OPTIONS}
                value={values.actionType}
                onChange={(e) => patch({ actionType: e.target.value })}
                disabled={disabled}
                fullWidth
                inputSize="md"
                menuVariant="inline"
              />
            </div>
          </ContactsCollapsibleFilterSection>

          <ContactsCollapsibleFilterSection
            title="Status"
            count={statusActive ? 1 : 0}
            defaultOpen={statusActive}
            onClear={statusActive ? () => patch({ status: "" }) : undefined}
          >
            <div className="c360-activity-filter-field--status">
              <Select
                label="Status"
                options={ACTIVITY_STATUS_OPTIONS}
                value={values.status}
                onChange={(e) => patch({ status: e.target.value })}
                disabled={disabled}
                fullWidth
                inputSize="md"
                menuVariant="inline"
              />
            </div>
          </ContactsCollapsibleFilterSection>

          <ContactsCollapsibleFilterSection
            title="Date range"
            count={dateActive ? 1 : 0}
            defaultOpen={dateActive}
            onClear={
              dateActive
                ? () => patch({ startDate: "", endDate: "" })
                : undefined
            }
          >
            <div className="c360-activity-filter-field--date">
              <Input
                label="Start (local)"
                type="datetime-local"
                value={values.startDate}
                onChange={(e) => patch({ startDate: e.target.value })}
                disabled={disabled}
                inputSize="md"
              />
            </div>
            <div className="c360-activity-filter-field--date">
              <Input
                label="End (local)"
                type="datetime-local"
                value={values.endDate}
                onChange={(e) => patch({ endDate: e.target.value })}
                disabled={disabled}
                inputSize="md"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="c360-mt-2"
              onClick={() => patch(activityLast24hDateRange())}
              disabled={disabled}
            >
              Last 24h
            </Button>
          </ContactsCollapsibleFilterSection>
        </div>
      </FilterSidebarBody>
    </div>
  );
}

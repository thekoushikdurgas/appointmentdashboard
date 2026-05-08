"use client";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import type { DraftSort } from "@/lib/vqlDraft";
import { sortableFields } from "@/lib/vqlFieldMeta";

export function VqlSortEditor({
  sort,
  onChange,
  entityType,
}: {
  sort: DraftSort[];
  onChange: (rows: DraftSort[]) => void;
  entityType: "contact" | "company";
}) {
  const fields = sortableFields(entityType);
  const add = () =>
    onChange([
      ...sort,
      { field: fields[0]?.key ?? "created_at", direction: "desc" },
    ]);
  const remove = (i: number) => onChange(sort.filter((_, j) => j !== i));
  const patch = (i: number, p: Partial<DraftSort>) =>
    onChange(sort.map((r, j) => (j === i ? { ...r, ...p } : r)));

  return (
    <div className="c360-vql-sort-list c360-flex c360-flex-col c360-gap-2">
      {sort.map((row, i) => (
        <div
          key={i}
          className="c360-flex c360-flex-wrap c360-gap-2 c360-items-center"
        >
          <Select
            value={row.field}
            onChange={(e) => patch(i, { field: e.target.value })}
            options={fields.map((f) => ({
              value: f.key,
              label: f.label,
            }))}
            aria-label="Sort field"
            fullWidth={false}
            triggerClassName="c360-w-auto"
          />
          <Select
            value={row.direction}
            onChange={(e) =>
              patch(i, { direction: e.target.value as "asc" | "desc" })
            }
            options={[
              { value: "asc", label: "Ascending" },
              { value: "desc", label: "Descending" },
            ]}
            aria-label="Sort direction"
            fullWidth={false}
            triggerClassName="c360-w-auto"
          />
          <button
            type="button"
            className={cn("c360-icon-btn", "c360-icon-btn--danger")}
            onClick={() => remove(i)}
            aria-label="Remove sort"
          >
            ×
          </button>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add}>
        + Add sort field
      </Button>
    </div>
  );
}

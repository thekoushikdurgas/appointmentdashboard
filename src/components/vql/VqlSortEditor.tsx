"use client";

import { Button } from "@/components/ui/Button";
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
          <select
            className="c360-input c360-select"
            value={row.field}
            onChange={(e) => patch(i, { field: e.target.value })}
            aria-label="Sort field"
          >
            {fields.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            className="c360-input c360-select c360-w-auto"
            value={row.direction}
            onChange={(e) =>
              patch(i, { direction: e.target.value as "asc" | "desc" })
            }
            aria-label="Sort direction"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
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

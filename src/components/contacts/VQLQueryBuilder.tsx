"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface VQLCondition {
  field: string;
  operator: string;
  value: string | null;
}

export interface VQLFilters {
  and?: Array<VQLCondition | VQLFilters>;
  or?: Array<VQLCondition | VQLFilters>;
}

export interface VQLQuery {
  filters?: VQLFilters;
}

export interface VQLQueryBuilderProps {
  open: boolean;
  onClose: () => void;
  onApply: (query: VQLQuery) => void;
  initialQuery?: VQLQuery | null;
}

/**
 * Advanced VQL (Visual Query Language) filter builder for the contacts page.
 * Supports multi-row AND/OR conditions mapped to GqlVQLQueryInput.
 */
export function VQLQueryBuilder({
  open,
  onClose,
  onApply,
  initialQuery,
}: VQLQueryBuilderProps) {
  const [logic, setLogic] = useState<"and" | "or">("and");
  const [rows, setRows] = useState<
    { id: string; field: string; operator: string; value: string }[]
  >(() => {
    const filters = initialQuery?.filters;
    const andConditions = ((filters?.and ?? []) as VQLCondition[]).filter(
      (c): c is VQLCondition =>
        typeof c.field === "string" && typeof c.operator === "string",
    );
    if (andConditions.length > 0) {
      return andConditions.map((c, idx) => ({
        id: String(idx),
        field: c.field,
        operator: c.operator,
        value: typeof c.value === "string" ? c.value : "",
      }));
    }
    return [{ id: "0", field: "", operator: "eq", value: "" }];
  });

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { id: String(prev.length), field: "", operator: "eq", value: "" },
    ]);

  const removeRow = (id: string) =>
    setRows((prev) =>
      prev.length > 1 ? prev.filter((r) => r.id !== id) : prev,
    );

  const updateRow = (
    id: string,
    patch: Partial<{ field: string; operator: string; value: string }>,
  ) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const hasValidCondition = rows.some((r) => r.field.trim());

  const handleApply = () => {
    const conditions: VQLCondition[] = rows
      .filter((r) => r.field.trim())
      .map((r) => ({
        field: r.field.trim(),
        operator: r.operator,
        value: r.value.trim() || null,
      }));
    if (!conditions.length) return;

    const filters: VQLFilters =
      logic === "and"
        ? { and: conditions }
        : { or: conditions.map((c) => ({ and: [c] })) };

    onApply({ filters });
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Advanced Filter Builder"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!hasValidCondition}>
            Apply Filters
          </Button>
        </>
      }
    >
      <div className="c360-flex c360-flex-col c360-gap-3">
        {/* Logic selector */}
        <div className="c360-flex c360-items-center c360-gap-2 c360-text-sm">
          <span className="c360-text-muted c360-font-medium">Match</span>
          <select
            value={logic}
            onChange={(e) => setLogic(e.target.value === "or" ? "or" : "and")}
            className="c360-input c360-select c360-w-auto"
            aria-label="Condition logic"
          >
            <option value="and">all conditions (AND)</option>
            <option value="or">any condition (OR)</option>
          </select>
        </div>

        {/* Condition rows */}
        {rows.map((row) => (
          <div key={row.id} className="c360-vql-query-row">
            <input
              type="text"
              value={row.field}
              onChange={(e) => updateRow(row.id, { field: e.target.value })}
              placeholder="Field (e.g. title, country)"
              className="c360-input"
              aria-label="Field"
            />
            <select
              value={row.operator}
              onChange={(e) => updateRow(row.id, { operator: e.target.value })}
              className="c360-input c360-select"
              aria-label="Operator"
            >
              <option value="eq">equals</option>
              <option value="neq">not equals</option>
              <option value="contains">contains</option>
              <option value="not_contains">not contains</option>
              <option value="in">in list</option>
              <option value="gte">≥</option>
              <option value="lte">≤</option>
              <option value="is_null">is empty</option>
              <option value="is_not_null">is not empty</option>
            </select>
            <input
              type="text"
              value={row.value}
              onChange={(e) => updateRow(row.id, { value: e.target.value })}
              placeholder="Value"
              className="c360-input"
              aria-label="Value"
              disabled={
                row.operator === "is_null" || row.operator === "is_not_null"
              }
            />
            <button
              type="button"
              className={cn(
                "c360-icon-btn",
                "c360-icon-btn--danger",
                "c360-text-lg",
                "c360-leading-none",
              )}
              onClick={() => removeRow(row.id)}
              aria-label="Remove condition"
            >
              ×
            </button>
          </div>
        ))}

        <Button type="button" variant="ghost" size="sm" onClick={addRow}>
          + Add condition
        </Button>
      </div>
    </Modal>
  );
}

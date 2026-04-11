"use client";

import { cn } from "@/lib/utils";
import {
  getFieldMeta,
  getFieldsForEntity,
  type VqlFieldMeta,
  type VqlFieldType,
} from "@/lib/vqlFieldMeta";
import type { DraftCondition, DraftGroup } from "@/lib/vqlDraft";
import { emptyDraftCondition, emptyDraftGroup } from "@/lib/vqlDraft";

export function VqlFieldSelect({
  value,
  onChange,
  entityType,
  className,
}: {
  value: string;
  onChange: (field: string) => void;
  entityType: "contact" | "company";
  className?: string;
}) {
  const fields = getFieldsForEntity(entityType);
  const groups: Record<string, VqlFieldMeta[]> = {};
  for (const f of fields) {
    const g = f.group === "company_denorm" ? "company_denorm" : f.group;
    groups[g] ??= [];
    groups[g].push(f);
  }
  const labels: Record<string, string> = {
    contact: "Contact",
    company_denorm: "Company (filter)",
    company: "Company",
  };
  return (
    <select
      className={cn("c360-input c360-select c360-vql-field-select", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Field"
    >
      <option value="">Field…</option>
      {(Object.keys(groups) as string[]).map((gk) => (
        <optgroup key={gk} label={labels[gk] ?? gk}>
          {groups[gk].map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

const TEXT_OPS = [
  { v: "contains", l: "Contains" },
  { v: "exact", l: "Exact phrase" },
  { v: "starts_with", l: "Starts with" },
  { v: "ncontains", l: "Not contains" },
];

const KW_OPS = [
  { v: "eq", l: "Equals" },
  { v: "ne", l: "Not equals" },
  { v: "in", l: "In list" },
  { v: "nin", l: "Not in list" },
];

const RANGE_OPS = [
  { v: "gte", l: ">=" },
  { v: "lte", l: "<=" },
  { v: "gt", l: ">" },
  { v: "lt", l: "<" },
  { v: "between", l: "Between" },
  { v: "ngte", l: "Not >=" },
  { v: "nlte", l: "Not <=" },
];

export function VqlOperatorSelect({
  fieldType,
  value,
  onChange,
  className,
}: {
  fieldType: VqlFieldType;
  value: string;
  onChange: (op: string) => void;
  className?: string;
}) {
  const opts =
    fieldType === "text"
      ? TEXT_OPS
      : fieldType === "range"
        ? RANGE_OPS
        : KW_OPS;
  return (
    <select
      className={cn(
        "c360-input c360-select c360-vql-operator-select",
        className,
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Operator"
    >
      {opts.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}

export function VqlValueInput({
  value,
  onChange,
  operator,
  fieldType,
  disabled,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  operator: string;
  fieldType: VqlFieldType;
  disabled?: boolean;
  className?: string;
}) {
  const hint =
    operator === "in" || operator === "nin"
      ? "Comma-separated values"
      : fieldType === "range"
        ? "Number or ISO date"
        : "Value";
  return (
    <input
      type="text"
      className={cn("c360-input c360-vql-value-input", className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={hint}
      disabled={disabled}
      aria-label="Value"
    />
  );
}

export function VqlTextClauseOptions({
  condition,
  onChange,
}: {
  condition: DraftCondition;
  onChange: (patch: Partial<DraftCondition>) => void;
}) {
  return (
    <div className="c360-vql-text-extras c360-flex c360-flex-wrap c360-gap-2 c360-text-xs">
      <span className="c360-text-muted">Match:</span>
      {(["exact", "shuffle", "substring"] as const).map((st) => (
        <label key={st} className="c360-flex c360-items-center c360-gap-1">
          <input
            type="radio"
            name={`st-${condition.id}`}
            checked={condition.searchType === st}
            onChange={() => onChange({ searchType: st })}
          />
          {st}
        </label>
      ))}
      <label className="c360-flex c360-items-center c360-gap-1">
        <input
          type="checkbox"
          checked={!!condition.fuzzy}
          onChange={(e) => onChange({ fuzzy: e.target.checked })}
        />
        Fuzzy
      </label>
      <label className="c360-flex c360-items-center c360-gap-1">
        Slop
        <input
          type="number"
          min={0}
          className="c360-input c360-w-16"
          value={condition.slop ?? ""}
          onChange={(e) =>
            onChange({
              slop: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
        />
      </label>
    </div>
  );
}

export function VqlConditionRow({
  condition,
  onChange,
  onRemove,
  entityType,
}: {
  condition: DraftCondition;
  onChange: (patch: Partial<DraftCondition>) => void;
  onRemove: () => void;
  entityType: "contact" | "company";
}) {
  const meta = condition.field
    ? getFieldMeta(condition.field, entityType)
    : undefined;
  const fieldType: VqlFieldType = meta?.type ?? "keyword";
  return (
    <div className="c360-vql-row c360-flex c360-flex-wrap c360-gap-2 c360-items-start">
      <VqlFieldSelect
        value={condition.field}
        onChange={(f) => onChange({ field: f })}
        entityType={entityType}
      />
      <VqlOperatorSelect
        fieldType={fieldType}
        value={condition.operator}
        onChange={(op) => onChange({ operator: op })}
      />
      <VqlValueInput
        value={condition.value}
        onChange={(v) => onChange({ value: v })}
        operator={condition.operator}
        fieldType={fieldType}
      />
      {fieldType === "text" && condition.field ? (
        <VqlTextClauseOptions condition={condition} onChange={onChange} />
      ) : null}
      <button
        type="button"
        className={cn("c360-icon-btn", "c360-icon-btn--danger")}
        onClick={onRemove}
        aria-label="Remove condition"
      >
        ×
      </button>
    </div>
  );
}

const MAX_DEPTH = 2;

export function VqlGroupEditor({
  group,
  onChange,
  entityType,
  depth = 0,
}: {
  group: DraftGroup;
  onChange: (g: DraftGroup) => void;
  entityType: "contact" | "company";
  depth?: number;
}) {
  const setLogic = (logic: "and" | "or") => onChange({ ...group, logic });

  const updateItem = (idx: number, next: DraftCondition | DraftGroup) => {
    const items = [...group.items];
    items[idx] = next;
    onChange({ ...group, items });
  };

  const removeItem = (idx: number) => {
    onChange({ ...group, items: group.items.filter((_, i) => i !== idx) });
  };

  const addCondition = () => {
    onChange({
      ...group,
      items: [...group.items, emptyDraftCondition()],
    });
  };

  const addSubgroup = () => {
    if (depth >= MAX_DEPTH - 1) return;
    onChange({
      ...group,
      items: [...group.items, emptyDraftGroup("and")],
    });
  };

  return (
    <div
      className={cn(
        "c360-vql-group",
        group.logic === "and" ? "c360-vql-group--and" : "c360-vql-group--or",
      )}
    >
      <div className="c360-flex c360-items-center c360-gap-2 c360-mb-2">
        <span className="c360-text-sm c360-text-muted">Match</span>
        <select
          className="c360-input c360-select c360-w-auto"
          value={group.logic}
          onChange={(e) => setLogic(e.target.value === "or" ? "or" : "and")}
          aria-label="Group logic"
        >
          <option value="and">ALL (AND)</option>
          <option value="or">ANY (OR)</option>
        </select>
        {group.logic === "or" ? (
          <span className="c360-text-xs c360-text-muted">
            Multiple OR branches merge as AND on the API until server supports
            OR.
          </span>
        ) : null}
      </div>
      {group.items.map((item, idx) =>
        "field" in item ? (
          <VqlConditionRow
            key={item.id}
            condition={item}
            onChange={(patch) => updateItem(idx, { ...item, ...patch })}
            onRemove={() => removeItem(idx)}
            entityType={entityType}
          />
        ) : (
          <div
            key={item.id}
            className="c360-vql-subgroup c360-pl-3 c360-border-l-2"
          >
            <VqlGroupEditor
              group={item}
              onChange={(g) => updateItem(idx, g)}
              entityType={entityType}
              depth={depth + 1}
            />
            <button
              type="button"
              className="c360-text-xs c360-mt-1"
              onClick={() => removeItem(idx)}
            >
              Remove group
            </button>
          </div>
        ),
      )}
      <div className="c360-flex c360-gap-2 c360-mt-2">
        <button
          type="button"
          className="c360-btn-ghost c360-text-sm"
          onClick={addCondition}
        >
          + Condition
        </button>
        {depth < MAX_DEPTH - 1 ? (
          <button
            type="button"
            className="c360-btn-ghost c360-text-sm"
            onClick={addSubgroup}
          >
            + Group
          </button>
        ) : null}
      </div>
    </div>
  );
}

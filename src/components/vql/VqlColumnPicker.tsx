"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";
import { getFieldsForEntity } from "@/lib/vqlFieldMeta";

export function VqlColumnPicker({
  entityType,
  selected,
  onChange,
  companyPopulate,
  companySelectColumns,
  onCompanyPopulateChange,
}: {
  entityType: "contact" | "company";
  selected: string[];
  onChange: (cols: string[]) => void;
  companyPopulate: boolean;
  companySelectColumns: string[];
  onCompanyPopulateChange: (pop: boolean, cols: string[]) => void;
}) {
  const fields = getFieldsForEntity(entityType).filter((f) => !f.filterOnly);
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const toggleCompanyCol = (key: string) => {
    const next = companySelectColumns.includes(key)
      ? companySelectColumns.filter((k) => k !== key)
      : [...companySelectColumns, key];
    onCompanyPopulateChange(next.length > 0 || companyPopulate, next);
  };

  return (
    <div className="c360-vql-col-grid c360-flex c360-flex-col c360-gap-4">
      <div>
        <p className="c360-text-sm c360-font-medium c360-mb-2">
          Columns (select_columns)
        </p>
        <div className="c360-flex c360-flex-col c360-gap-2">
          {fields.map((f) => (
            <label
              key={f.key}
              className={cn(
                "c360-flex c360-items-center c360-gap-2",
                "c360-text-sm",
              )}
            >
              <Checkbox
                checked={selected.includes(f.key)}
                onChange={() => toggle(f.key)}
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>
      {entityType === "contact" ? (
        <div className="c360-border-t c360-pt-3">
          <p className="c360-text-sm c360-font-medium c360-mb-2">
            Nested company (company_config)
          </p>
          <label className="c360-flex c360-items-center c360-gap-2 c360-mb-2">
            <Checkbox
              checked={companyPopulate}
              onChange={(checked) =>
                onCompanyPopulateChange(checked, companySelectColumns)
              }
            />
            Populate company object
          </label>
          {companyPopulate ? (
            <div className="c360-flex c360-flex-col c360-gap-2 c360-pl-4">
              {[
                "uuid",
                "name",
                "website",
                "employees_count",
                "industries",
                "linkedin_url",
              ].map((key) => (
                <label
                  key={key}
                  className="c360-flex c360-items-center c360-gap-2 c360-text-sm"
                >
                  <Checkbox
                    checked={
                      companySelectColumns.includes(key) ||
                      (key === "uuid" && companySelectColumns.length === 0)
                    }
                    onChange={() => toggleCompanyCol(key)}
                  />
                  {key}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { HsFilterSection } from "@/components/feature/hiring-signals/HsFilterSection";
import { HS_FILTER_SECTION_IDS } from "@/components/feature/hiring-signals/hsFilterSectionIds";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import { useRole } from "@/context/RoleContext";

function dataQualityActiveCount(draft: {
  companyMissingWebsite: boolean;
  companyMissingRevenue: boolean;
  companyCsuiteContactMinCount: number | null;
  companyHrContactMinCount: number | null;
}): number {
  let n = 0;
  if (draft.companyMissingWebsite) n += 1;
  if (draft.companyMissingRevenue) n += 1;
  if (draft.companyCsuiteContactMinCount != null) n += 1;
  if (draft.companyHrContactMinCount != null) n += 1;
  return n;
}

function formatUnderLabel(value: number): string {
  if (value === 0) return "0 (no contacts)";
  return String(value);
}

/** Super-admin only — parent sidebar gates visibility; this guards direct usage. */
export function HiringSignalsDataQualityFilters() {
  const { isSuperAdmin } = useRole();
  const { draft, onDraftField } = useHireSignalFilter();
  const activeCount = dataQualityActiveCount(draft);

  if (!isSuperAdmin) {
    return null;
  }

  const csuiteEnabled = draft.companyCsuiteContactMinCount != null;
  const hrEnabled = draft.companyHrContactMinCount != null;

  return (
    <>
      <h3 className="c360-hs-filters__group-header">Data quality</h3>
      <HsFilterSection
        sectionId={HS_FILTER_SECTION_IDS.dataQuality}
        title="Data Quality"
        count={activeCount}
        onClear={
          activeCount > 0
            ? () => {
                onDraftField("companyMissingWebsite", false);
                onDraftField("companyMissingRevenue", false);
                onDraftField("companyCsuiteContactMinCount", null);
                onDraftField("companyHrContactMinCount", null);
              }
            : undefined
        }
      >
        <div className="c360-space-y-3">
          <label className="c360-flex c360-items-start c360-gap-2 c360-text-2xs">
            <input
              type="checkbox"
              className="c360-mt-0.5"
              checked={draft.companyMissingWebsite}
              onChange={(e) =>
                onDraftField("companyMissingWebsite", e.target.checked)
              }
            />
            <span>Missing website (null or empty)</span>
          </label>

          <label className="c360-flex c360-items-start c360-gap-2 c360-text-2xs">
            <input
              type="checkbox"
              className="c360-mt-0.5"
              checked={draft.companyMissingRevenue}
              onChange={(e) =>
                onDraftField("companyMissingRevenue", e.target.checked)
              }
            />
            <span>Missing revenue (null or zero)</span>
          </label>

          <div className="c360-space-y-1">
            <label className="c360-flex c360-items-center c360-gap-2 c360-text-2xs">
              <input
                type="checkbox"
                className="c360-shrink-0"
                checked={csuiteEnabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    onDraftField("companyCsuiteContactMinCount", 0);
                  } else {
                    onDraftField("companyCsuiteContactMinCount", null);
                  }
                }}
              />
              <span className="c360-shrink-0">C-Suite contacts under</span>
              <input
                type="number"
                min={0}
                step={1}
                className="c360-hs-filters__number-input c360-w-16"
                disabled={!csuiteEnabled}
                value={
                  csuiteEnabled
                    ? String(draft.companyCsuiteContactMinCount ?? 0)
                    : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    onDraftField("companyCsuiteContactMinCount", 0);
                    return;
                  }
                  const n = Math.floor(Number(raw));
                  if (Number.isFinite(n) && n >= 0) {
                    onDraftField("companyCsuiteContactMinCount", n);
                  }
                }}
              />
            </label>
            <p className="c360-pl-6 c360-text-2xs c360-text-ink-muted">
              Companies with fewer than{" "}
              {csuiteEnabled
                ? formatUnderLabel(draft.companyCsuiteContactMinCount ?? 0)
                : "…"}{" "}
              C-Suite contacts (use 0 for companies with none).
            </p>
          </div>

          <div className="c360-space-y-1">
            <label className="c360-flex c360-items-center c360-gap-2 c360-text-2xs">
              <input
                type="checkbox"
                className="c360-shrink-0"
                checked={hrEnabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    onDraftField("companyHrContactMinCount", 0);
                  } else {
                    onDraftField("companyHrContactMinCount", null);
                  }
                }}
              />
              <span className="c360-shrink-0">HR contacts under</span>
              <input
                type="number"
                min={0}
                step={1}
                className="c360-hs-filters__number-input c360-w-16"
                disabled={!hrEnabled}
                value={
                  hrEnabled ? String(draft.companyHrContactMinCount ?? 0) : ""
                }
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    onDraftField("companyHrContactMinCount", 0);
                    return;
                  }
                  const n = Math.floor(Number(raw));
                  if (Number.isFinite(n) && n >= 0) {
                    onDraftField("companyHrContactMinCount", n);
                  }
                }}
              />
            </label>
            <p className="c360-pl-6 c360-text-2xs c360-text-ink-muted">
              Companies with fewer than{" "}
              {hrEnabled
                ? formatUnderLabel(draft.companyHrContactMinCount ?? 0)
                : "…"}{" "}
              Human Resources contacts (use 0 for companies with none).
            </p>
          </div>
        </div>
      </HsFilterSection>
    </>
  );
}

"use client";

import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { ContactsCollapsibleFilterSection } from "@/components/feature/contacts/ContactsCollapsibleFilterSection";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import {
  formatSalaryUsdLabel,
  normalizeHiringSignalTokenList,
  postedAfterISOFromPreset,
  postedAtBoundToDateInputValue,
  resolveSalaryBoundsFromDraft,
  type DatePostedPreset,
  type HiringSignalFilterDraft,
  type HiringSignalDraftField,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { HiringSignalTextFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalTextFacetCombobox";
import type { JobListFilters } from "@/services/graphql/hiringSignalService";

const LINKEDIN_APPLY_METHOD = "ComplexOnsiteApply";
/** Matches scraper.server `infer_apply_method_guest` → `SimpleOnsiteApply`. */
const EASY_APPLY_METHOD = "SimpleOnsiteApply";

const EMPLOYMENT_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Contract", label: "Contract" },
  { value: "Temporary", label: "Temporary" },
  { value: "Volunteer", label: "Volunteer" },
  { value: "Internship", label: "Internship" },
  { value: "Remote", label: "Remote" },
  { value: "Other", label: "Other" },
];

const WORKPLACE_OPTIONS = [
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "On-site", label: "On-site" },
];

const WORKPLACE_SELECT_OPTIONS = [
  { value: "", label: "Any" },
  ...WORKPLACE_OPTIONS,
];

const APPLY_METHOD_OPTIONS = [
  { value: "", label: "Any" },
  { value: "SimpleOnsiteApply", label: "Easy apply (onsite)" },
  { value: "ComplexOnsiteApply", label: "LinkedIn apply" },
  { value: "OffsiteApply", label: "Company website / external" },
];

/** Values match job.server ingest `experience_bucket`; labels mirror LinkedIn-style wording. */
const EXPERIENCE_BUCKET_OPTIONS = [
  { value: "intern", label: "Internship" },
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Associate / mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead_staff", label: "Lead / staff / principal" },
  { value: "director_exec", label: "Director / executive" },
];

const EXPERIENCE_BUCKET_SELECT_OPTIONS = [
  { value: "", label: "Any" },
  ...EXPERIENCE_BUCKET_OPTIONS,
];

const EDUCATION_MIN_OPTIONS = [
  { value: "certificate", label: "Certificate" },
  { value: "associate", label: "Associate" },
  { value: "bachelors", label: "Bachelor's" },
  { value: "masters", label: "Master's" },
  { value: "mba", label: "MBA" },
  { value: "phd", label: "PhD" },
];

const EDUCATION_MIN_SELECT_OPTIONS = [
  { value: "", label: "Any" },
  ...EDUCATION_MIN_OPTIONS,
];

/** Substring match on job `industries` / category topic (denormalized from ingest). */
const INDUSTRY_FILTER_OPTIONS = [
  { value: "Software", label: "Software" },
  { value: "Technology", label: "Technology" },
  { value: "Financial Services", label: "Financial Services" },
  { value: "Banking", label: "Banking" },
  { value: "Insurance", label: "Insurance" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Hospital", label: "Hospital & health care" },
  { value: "Pharmaceuticals", label: "Pharmaceuticals" },
  { value: "Biotechnology", label: "Biotechnology" },
  { value: "Retail", label: "Retail" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Automotive", label: "Automotive" },
  { value: "Energy", label: "Energy" },
  { value: "Telecommunications", label: "Telecommunications" },
  { value: "IT Services", label: "IT services" },
  { value: "Staffing", label: "Staffing & recruiting" },
  { value: "Consulting", label: "Consulting" },
  { value: "Education", label: "Education" },
  { value: "Government", label: "Government" },
  { value: "Media", label: "Media" },
  { value: "Legal", label: "Legal" },
  { value: "Real Estate", label: "Real estate" },
  { value: "Construction", label: "Construction" },
  { value: "Transportation", label: "Transportation" },
  { value: "Logistics", label: "Logistics" },
  { value: "Consumer Goods", label: "Consumer goods" },
  { value: "Food", label: "Food & beverage" },
  { value: "Aerospace", label: "Aerospace" },
  { value: "Internet", label: "Internet" },
];

const INDUSTRY_SELECT_OPTIONS = [
  { value: "", label: "Any" },
  ...INDUSTRY_FILTER_OPTIONS,
];

const COUNTRY_FILTER_OPTIONS = [
  { value: "US", label: "United States (US)" },
  { value: "CA", label: "Canada (CA)" },
  { value: "GB", label: "United Kingdom (GB)" },
  { value: "DE", label: "Germany (DE)" },
  { value: "FR", label: "France (FR)" },
  { value: "IN", label: "India (IN)" },
  { value: "AU", label: "Australia (AU)" },
  { value: "NL", label: "Netherlands (NL)" },
  { value: "IE", label: "Ireland (IE)" },
  { value: "SG", label: "Singapore (SG)" },
  { value: "JP", label: "Japan (JP)" },
  { value: "CN", label: "China (CN)" },
  { value: "BR", label: "Brazil (BR)" },
  { value: "MX", label: "Mexico (MX)" },
  { value: "ES", label: "Spain (ES)" },
  { value: "IT", label: "Italy (IT)" },
  { value: "CH", label: "Switzerland (CH)" },
  { value: "SE", label: "Sweden (SE)" },
  { value: "NO", label: "Norway (NO)" },
  { value: "DK", label: "Denmark (DK)" },
  { value: "FI", label: "Finland (FI)" },
  { value: "PL", label: "Poland (PL)" },
  { value: "IL", label: "Israel (IL)" },
  { value: "AT", label: "Austria (AT)" },
  { value: "BE", label: "Belgium (BE)" },
  { value: "PT", label: "Portugal (PT)" },
  { value: "NZ", label: "New Zealand (NZ)" },
  { value: "KR", label: "South Korea (KR)" },
  { value: "TW", label: "Taiwan (TW)" },
  { value: "HK", label: "Hong Kong (HK)" },
  { value: "MY", label: "Malaysia (MY)" },
  { value: "PH", label: "Philippines (PH)" },
  { value: "TH", label: "Thailand (TH)" },
  { value: "VN", label: "Vietnam (VN)" },
  { value: "ID", label: "Indonesia (ID)" },
  { value: "TR", label: "Turkey (TR)" },
  { value: "ZA", label: "South Africa (ZA)" },
  { value: "AE", label: "United Arab Emirates (AE)" },
  { value: "SA", label: "Saudi Arabia (SA)" },
  { value: "AR", label: "Argentina (AR)" },
  { value: "CO", label: "Colombia (CO)" },
  { value: "NG", label: "Nigeria (NG)" },
  { value: "EG", label: "Egypt (EG)" },
  { value: "PK", label: "Pakistan (PK)" },
  { value: "BD", label: "Bangladesh (BD)" },
  { value: "CZ", label: "Czech Republic (CZ)" },
  { value: "RO", label: "Romania (RO)" },
  { value: "UA", label: "Ukraine (UA)" },
];

const COUNTRY_ADD_SELECT_OPTIONS = [
  { value: "", label: "Add country…" },
  ...COUNTRY_FILTER_OPTIONS,
];

/** Values align with job.server `skillKeywords` → ingested `skill_tags` (case-insensitive). */
const SKILL_TAG_FILTER_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "golang", label: "Golang" },
  { value: "java", label: "Java" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "react", label: "React" },
  { value: "node.js", label: "Node.js" },
  { value: "kubernetes", label: "Kubernetes" },
  { value: "docker", label: "Docker" },
  { value: "aws", label: "AWS" },
  { value: "sql", label: "SQL" },
  { value: "postgres", label: "Postgres" },
  { value: "mongodb", label: "MongoDB" },
  { value: "redis", label: "Redis" },
  { value: "kafka", label: "Kafka" },
  { value: "machine learning", label: "Machine learning" },
  { value: "tensorflow", label: "TensorFlow" },
  { value: "pytorch", label: "PyTorch" },
  { value: "data science", label: "Data science" },
];

const SALARY_RANGE_PRESET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "50000", label: "$50k+" },
  { value: "80000", label: "$80k+" },
  { value: "100000", label: "$100k+" },
  { value: "120000", label: "$120k+" },
  { value: "150000", label: "$150k+" },
  { value: "200000", label: "$200k+" },
  { value: "custom", label: "Custom range…" },
];

const SKILL_TAG_ADD_SELECT_OPTIONS = [
  { value: "", label: "Add required skill…" },
  ...SKILL_TAG_FILTER_OPTIONS,
];

const CLEARANCE_OPTIONS = [
  { value: "", label: "No clearance filter" },
  { value: "hide", label: "Hide clearance-required" },
  { value: "only", label: "Only clearance-required" },
];

/** Substring match on ingested `seniority_level` (LinkedIn-style titles). */
const SENIORITY_PRESET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Internship", label: "Internship" },
  { value: "Entry level", label: "Entry level" },
  { value: "Associate", label: "Associate" },
  { value: "Mid-Senior", label: "Mid-Senior level" },
  { value: "Senior", label: "Senior" },
  { value: "Director", label: "Director" },
  { value: "Executive", label: "Executive" },
  { value: "VP", label: "VP" },
  { value: "C-Suite", label: "C-Suite" },
];

const DATE_POSTED_PRESET_OPTIONS: {
  value: DatePostedPreset;
  label: string;
}[] = [
  { value: "any", label: "Any time" },
  { value: "24h", label: "Last 4 days (UTC, rolling)" },
  { value: "7d", label: "Last 7 days (UTC)" },
  { value: "30d", label: "Last 30 days (UTC)" },
  { value: "custom", label: "Custom range" },
];

const DATE_POSTED_PRESET_LABELS: Record<
  Exclude<DatePostedPreset, "any" | "custom">,
  string
> = {
  "24h": "Last 4 days (UTC, rolling)",
  "7d": "Last 7 days (UTC)",
  "30d": "Last 30 days (UTC)",
};

const VIEW_MODE_OPTIONS = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

const FUNCTION_PRESET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Engineering", label: "Engineering" },
  { value: "Sales", label: "Sales" },
  { value: "Marketing", label: "Marketing" },
  { value: "Operations", label: "Operations" },
  { value: "Finance", label: "Finance" },
  { value: "Human Resources", label: "Human Resources" },
  { value: "Product", label: "Product" },
  { value: "Design", label: "Design" },
  { value: "Legal", label: "Legal" },
  { value: "Consulting", label: "Consulting" },
  { value: "Other", label: "Other" },
];

export type HsFilterChipItem = {
  key: string;
  label: string;
  onRemove: () => void;
};

export type HsChipBucketKey =
  | "title"
  | "company"
  | "location"
  | "datePosted"
  | "experienceLevel"
  | "jobType"
  | "workplace"
  | "linkedInApply"
  | "industries"
  | "jobFunction"
  | "compensation"
  | "roleEducation"
  | "skills"
  | "compliance";

function emptyHiringSignalChipBuckets(): Record<
  HsChipBucketKey,
  HsFilterChipItem[]
> {
  return {
    title: [],
    company: [],
    location: [],
    datePosted: [],
    experienceLevel: [],
    jobType: [],
    workplace: [],
    linkedInApply: [],
    industries: [],
    jobFunction: [],
    compensation: [],
    roleEducation: [],
    skills: [],
    compliance: [],
  };
}

function buildHiringSignalChipBuckets(
  draft: HiringSignalFilterDraft,
  onDraftField: (
    field: HiringSignalDraftField,
    value: string | string[] | boolean,
  ) => void,
): Record<HsChipBucketKey, HsFilterChipItem[]> {
  const b = emptyHiringSignalChipBuckets();
  const add = (section: HsChipBucketKey, item: HsFilterChipItem) => {
    b[section].push(item);
  };

  const addTokenChips = (
    section: HsChipBucketKey,
    prefix: string,
    values: string[],
    labelPrefix: string,
    field: HiringSignalDraftField,
  ) => {
    values.forEach((raw, i) => {
      const t = raw.trim();
      if (!t) return;
      add(section, {
        key: `${prefix}-${i}-${t}`,
        label: `${labelPrefix}: ${t}`,
        onRemove: () => {
          onDraftField(
            field,
            values.filter((_, j) => j !== i),
          );
        },
      });
    });
  };

  addTokenChips("title", "title", draft.titles, "Title", "titles");
  addTokenChips("company", "co", draft.companies, "Company", "companies");
  addTokenChips("location", "loc", draft.locations, "Location", "locations");
  addTokenChips(
    "title",
    "exti",
    draft.excludedTitles,
    "Excl. title",
    "excludedTitles",
  );
  addTokenChips(
    "company",
    "exco",
    draft.excludedCompanies,
    "Excl. company",
    "excludedCompanies",
  );
  addTokenChips(
    "location",
    "exloc",
    draft.excludedLocations,
    "Excl. location",
    "excludedLocations",
  );

  addTokenChips(
    "jobType",
    "emp",
    draft.employmentTypes,
    "Employment",
    "employmentTypes",
  );
  if (draft.employmentType.trim()) {
    add("jobType", {
      key: "emp-single",
      label: `Employment type: ${draft.employmentType}`,
      onRemove: () => onDraftField("employmentType", ""),
    });
  }
  addTokenChips(
    "workplace",
    "wp",
    draft.workplaceTypes,
    "Workplace",
    "workplaceTypes",
  );
  addTokenChips(
    "industries",
    "ind",
    draft.industries,
    "Category",
    "industries",
  );
  addTokenChips(
    "industries",
    "exind",
    draft.excludedIndustries,
    "Excl. category",
    "excludedIndustries",
  );
  addTokenChips(
    "experienceLevel",
    "xb",
    draft.experienceBuckets,
    "Experience",
    "experienceBuckets",
  );
  addTokenChips(
    "roleEducation",
    "edu",
    draft.educationLevelMins,
    "Education ≥",
    "educationLevelMins",
  );
  addTokenChips("skills", "sk", draft.skillsAll, "Required skill", "skillsAll");
  addTokenChips("location", "ctry", draft.countries, "Country", "countries");

  if (draft.applyMethod.trim()) {
    add("linkedInApply", {
      key: "applym",
      label:
        draft.applyMethod === LINKEDIN_APPLY_METHOD
          ? "LinkedIn Apply (hosted)"
          : draft.applyMethod === EASY_APPLY_METHOD
            ? "Easy apply (LinkedIn)"
            : `Apply method: ${draft.applyMethod}`,
      onRemove: () => onDraftField("applyMethod", ""),
    });
  }

  {
    const { salaryMin, salaryMax } = resolveSalaryBoundsFromDraft(draft);
    if (salaryMin != null || salaryMax != null) {
      const label =
        salaryMin != null && salaryMax != null
          ? `Salary: ${formatSalaryUsdLabel(salaryMin)} – ${formatSalaryUsdLabel(salaryMax)}`
          : salaryMin != null
            ? `Salary: ${formatSalaryUsdLabel(salaryMin)}+`
            : `Salary: up to ${formatSalaryUsdLabel(salaryMax!)}`;
      add("compensation", {
        key: "salary",
        label,
        onRemove: () => {
          onDraftField("salaryPreset", "");
          onDraftField("salaryMin", "");
          onDraftField("salaryMax", "");
        },
      });
    }
  }

  if (draft.clearanceMode.trim() === "hide") {
    add("compliance", {
      key: "clr",
      label: "Clearance: hide required",
      onRemove: () => onDraftField("clearanceMode", ""),
    });
  }
  if (draft.clearanceMode.trim() === "only") {
    add("compliance", {
      key: "clo",
      label: "Clearance: only required",
      onRemove: () => onDraftField("clearanceMode", ""),
    });
  }

  if (draft.h1bOnly) {
    add("compliance", {
      key: "h1b",
      label: "H1B / sponsorship mention",
      onRemove: () => onDraftField("h1bOnly", false),
    });
  }

  if (draft.seniorityPreset.trim() || draft.seniorityCustom.trim()) {
    const s =
      draft.seniorityCustom.trim() || draft.seniorityPreset.trim() || "";
    add("experienceLevel", {
      key: "seniority",
      label: `Seniority: ${s}`,
      onRemove: () => {
        onDraftField("seniorityPreset", "");
        onDraftField("seniorityCustom", "");
      },
    });
  }
  if (draft.functionPreset.trim() || draft.functionCustom.trim()) {
    const s = draft.functionCustom.trim() || draft.functionPreset.trim() || "";
    add("jobFunction", {
      key: "func",
      label: `Function: ${s}`,
      onRemove: () => {
        onDraftField("functionPreset", "");
        onDraftField("functionCustom", "");
      },
    });
  }
  if (
    draft.datePostedPreset === "24h" ||
    draft.datePostedPreset === "7d" ||
    draft.datePostedPreset === "30d"
  ) {
    const pk = draft.datePostedPreset;
    add("datePosted", {
      key: "dpreset",
      label: `Date posted: ${DATE_POSTED_PRESET_LABELS[pk]}`,
      onRemove: () => {
        onDraftField("datePostedPreset", "any");
        onDraftField("postedAfter", "");
      },
    });
  } else if (draft.postedAfter.trim()) {
    add("datePosted", {
      key: "after",
      label: `Posted after ${draft.postedAfter}`,
      onRemove: () => {
        onDraftField("postedAfter", "");
        onDraftField("datePostedPreset", "any");
      },
    });
  }
  if (draft.postedBefore.trim()) {
    add("datePosted", {
      key: "before",
      label: `Before ${draft.postedBefore}`,
      onRemove: () => onDraftField("postedBefore", ""),
    });
  }

  return b;
}

function HsFilterChipList({
  items,
  variant = "default",
}: {
  items: HsFilterChipItem[];
  variant?: "default" | "section";
}) {
  if (items.length === 0) return null;
  return (
    <div
      className={cn(
        "c360-hs-filter-chips",
        variant === "section" && "c360-hs-filter-chips--section",
      )}
      role="list"
    >
      {items.map((c) => (
        <span key={c.key} className="c360-hs-filter-chip" role="listitem">
          <span className="c360-hs-filter-chip__text">{c.label}</span>
          <button
            type="button"
            className="c360-hs-filter-chip__remove"
            aria-label={`Remove ${c.label}`}
            onClick={c.onRemove}
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

export type {
  HiringSignalFilterDraft,
  HiringSignalDraftField,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
export { EMPTY_HIRING_SIGNAL_DRAFT } from "@/components/feature/hiring-signals/hiringSignalFilterDraft";

export interface HiringSignalsFilterSidebarProps {
  /** Applied list filters (API state) — used to scope facet option queries. */
  appliedListFilters: JobListFilters;
  signalTimePreset: "all" | "new_7d";
  /** Active job.server ingest run filter (from Runs tab drill-down). */
  appliedRunId?: string;
  /** Total jobs matching the current filters (pass when `appliedRunId` is set to show count on the run chip). */
  runScopedJobTotal?: number;
  onClearRunId?: () => void;
  className?: string;
  drawerTitleId?: string;
  /** Table row density — mirrors the toolbar view-mode select. */
  tableDensity?: "comfortable" | "compact";
  onTableDensityChange?: (density: "comfortable" | "compact") => void;
}

export function HiringSignalsFilterSidebar({
  appliedListFilters,
  signalTimePreset,
  appliedRunId,
  runScopedJobTotal,
  onClearRunId,
  className,
  drawerTitleId = "c360-hs-filter-drawer-title",
  tableDensity = "comfortable",
  onTableDensityChange,
}: HiringSignalsFilterSidebarProps) {
  const { draft, onDraftField, resetFilters, setDraft } = useHireSignalFilter();

  const appendCountryCode = (code: string) => {
    const v = code.trim();
    if (!v) return;
    const cur = normalizeHiringSignalTokenList(draft.countries);
    if (cur.includes(v)) return;
    onDraftField("countries", [...cur, v]);
  };

  const appendSkillTag = (token: string) => {
    const v = token.trim();
    if (!v) return;
    const cur = normalizeHiringSignalTokenList(draft.skillsAll);
    if (cur.includes(v)) return;
    onDraftField("skillsAll", [...cur, v]);
  };

  const chipBuckets = useMemo(
    () => buildHiringSignalChipBuckets(draft, onDraftField),
    [draft, onDraftField],
  );

  const draftChipCount = useMemo(
    () => Object.values(chipBuckets).reduce((n, arr) => n + arr.length, 0),
    [chipBuckets],
  );

  const hasRunChip = Boolean(appliedRunId?.trim() && onClearRunId);
  const totalChips = draftChipCount + (hasRunChip ? 1 : 0);

  const runIdTrimmed = appliedRunId?.trim() ?? "";
  const runChip =
    hasRunChip && onClearRunId ? (
      <span className="c360-hs-filter-chip">
        <span className="c360-hs-filter-chip__text">
          Run: {runIdTrimmed.slice(0, 12)}
          {runIdTrimmed.length > 12 ? "…" : ""}
          {typeof runScopedJobTotal === "number" &&
          Number.isFinite(runScopedJobTotal) ? (
            <> · {runScopedJobTotal.toLocaleString()} jobs</>
          ) : null}
        </span>
        <button
          type="button"
          className="c360-hs-filter-chip__remove"
          aria-label="Clear run filter"
          onClick={onClearRunId}
        >
          <X size={12} />
        </button>
      </span>
    ) : null;
  const titleValues = normalizeHiringSignalTokenList(draft.titles);
  const companyValues = normalizeHiringSignalTokenList(draft.companies);
  const locationValues = normalizeHiringSignalTokenList(draft.locations);
  const seniorityCount =
    draft.seniorityPreset.trim() || draft.seniorityCustom.trim() ? 1 : 0;
  const functionCount =
    draft.functionPreset.trim() || draft.functionCustom.trim() ? 1 : 0;

  const employmentCount =
    normalizeHiringSignalTokenList(draft.employmentTypes).length +
    (draft.employmentType.trim() ? 1 : 0);
  const normalizedWorkplaceTypes = normalizeHiringSignalTokenList(
    draft.workplaceTypes,
  );
  const workplaceCount = normalizedWorkplaceTypes.length;
  const workplaceSelectValue =
    normalizedWorkplaceTypes.length === 1 &&
    WORKPLACE_OPTIONS.some((o) => o.value === normalizedWorkplaceTypes[0])
      ? normalizedWorkplaceTypes[0]
      : "";
  const normalizedExperienceBuckets = normalizeHiringSignalTokenList(
    draft.experienceBuckets,
  );
  const experienceBucketSelectValue =
    normalizedExperienceBuckets.length === 1 &&
    EXPERIENCE_BUCKET_OPTIONS.some(
      (o) => o.value === normalizedExperienceBuckets[0],
    )
      ? normalizedExperienceBuckets[0]
      : "";
  const normalizedEducationLevelMins = normalizeHiringSignalTokenList(
    draft.educationLevelMins,
  );
  const educationMinSelectValue =
    normalizedEducationLevelMins.length === 1 &&
    EDUCATION_MIN_OPTIONS.some(
      (o) => o.value === normalizedEducationLevelMins[0],
    )
      ? normalizedEducationLevelMins[0]
      : "";
  const normalizedIndustries = normalizeHiringSignalTokenList(draft.industries);
  const industryIncludeSelectValue =
    normalizedIndustries.length === 1 &&
    INDUSTRY_FILTER_OPTIONS.some((o) => o.value === normalizedIndustries[0])
      ? normalizedIndustries[0]
      : "";
  const normalizedExcludedIndustries = normalizeHiringSignalTokenList(
    draft.excludedIndustries,
  );
  const industryExcludeSelectValue =
    normalizedExcludedIndustries.length === 1 &&
    INDUSTRY_FILTER_OPTIONS.some(
      (o) => o.value === normalizedExcludedIndustries[0],
    )
      ? normalizedExcludedIndustries[0]
      : "";
  const industriesCount = normalizeHiringSignalTokenList(
    draft.industries,
  ).length;
  const exIndCount = normalizeHiringSignalTokenList(
    draft.excludedIndustries,
  ).length;
  const exTitleCount = normalizeHiringSignalTokenList(
    draft.excludedTitles,
  ).length;
  const exCoCount = normalizeHiringSignalTokenList(
    draft.excludedCompanies,
  ).length;
  const exLocCount = normalizeHiringSignalTokenList(
    draft.excludedLocations,
  ).length;
  const salaryBounds = resolveSalaryBoundsFromDraft(draft);
  const salaryCount =
    draft.salaryPreset.trim() ||
    salaryBounds.salaryMin != null ||
    salaryBounds.salaryMax != null
      ? 1
      : 0;
  const expBucketCount = normalizeHiringSignalTokenList(
    draft.experienceBuckets,
  ).length;
  const eduCount = normalizeHiringSignalTokenList(
    draft.educationLevelMins,
  ).length;
  const skillsCount = normalizeHiringSignalTokenList(draft.skillsAll).length;
  const countryCount = normalizeHiringSignalTokenList(draft.countries).length;
  const applyMethodCount = draft.applyMethod.trim() ? 1 : 0;
  const clearanceCount =
    draft.clearanceMode.trim() === "hide" ||
    draft.clearanceMode.trim() === "only"
      ? 1
      : 0;
  const h1bCount = draft.h1bOnly ? 1 : 0;

  const datePostedCount =
    draft.datePostedPreset !== "any"
      ? 1
      : draft.postedBefore.trim() || draft.postedAfter.trim()
        ? 1
        : 0;

  const experienceLevelCount = seniorityCount + expBucketCount;

  const onDatePostedPresetChange = (raw: string) => {
    const v = raw as DatePostedPreset;
    if (v === "any") {
      onDraftField("datePostedPreset", "any");
      onDraftField("postedAfter", "");
      onDraftField("postedBefore", "");
      return;
    }
    if (v === "custom") {
      onDraftField("datePostedPreset", "custom");
      return;
    }
    if (v === "24h" || v === "7d" || v === "30d") {
      const iso = postedAfterISOFromPreset(v);
      onDraftField("datePostedPreset", v);
      onDraftField("postedAfter", iso);
      onDraftField("postedBefore", "");
    }
  };

  return (
    <div className={cn("c360-contacts-filters c360-hs-filters", className)}>
      <div className="c360-contacts-filters__head-row">
        <div className="c360-contacts-filters__head-text">
          <div className="c360-contacts-filters__head">
            <h2 id={drawerTitleId} className="c360-contacts-filters__title">
              Refine signals
            </h2>
          </div>
          <p className="c360-contacts-filters__subtitle">{totalChips} active</p>
        </div>
        <div className="c360-contacts-filters__head-actions">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="c360-contacts-filters__clear-text"
            onClick={resetFilters}
          >
            Clear
          </Button>
        </div>
      </div>

      {hasRunChip ? (
        <div className="c360-hs-filters__run-row c360-mb-2">
          <div className="c360-hs-filter-chips c360-hs-filter-chips--run">
            {runChip}
          </div>
        </div>
      ) : null}

      <div className="c360-hs-filters__sections">
        <ContactsCollapsibleFilterSection
          title="Title"
          count={titleValues.length + exTitleCount}
          defaultOpen
          onClear={() => {
            onDraftField("titles", []);
            onDraftField("excludedTitles", []);
          }}
        >
          <div className="c360-space-y-3">
            <HsFilterChipList items={chipBuckets.title} variant="section" />
            <HiringSignalTextFacetCombobox
              field="title"
              label="Include job titles"
              draft={draft}
              appliedListFilters={appliedListFilters}
              signalTimePreset={signalTimePreset}
              selectedValues={titleValues}
              onSelectionChange={(v) => onDraftField("titles", v)}
            />
            <HiringSignalTextFacetCombobox
              field="title"
              label="Exclude job titles"
              draft={draft}
              appliedListFilters={appliedListFilters}
              signalTimePreset={signalTimePreset}
              selectedValues={normalizeHiringSignalTokenList(
                draft.excludedTitles,
              )}
              onSelectionChange={(v) => onDraftField("excludedTitles", v)}
            />
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Company"
          count={companyValues.length + exCoCount}
          defaultOpen
          onClear={() => {
            onDraftField("companies", []);
            onDraftField("excludedCompanies", []);
          }}
        >
          <div className="c360-space-y-3">
            <HsFilterChipList items={chipBuckets.company} variant="section" />
            <HiringSignalTextFacetCombobox
              field="company"
              label="Include company names"
              draft={draft}
              appliedListFilters={appliedListFilters}
              signalTimePreset={signalTimePreset}
              selectedValues={companyValues}
              onSelectionChange={(v) => onDraftField("companies", v)}
            />
            <HiringSignalTextFacetCombobox
              field="company"
              label="Exclude company names"
              draft={draft}
              appliedListFilters={appliedListFilters}
              signalTimePreset={signalTimePreset}
              selectedValues={normalizeHiringSignalTokenList(
                draft.excludedCompanies,
              )}
              onSelectionChange={(v) => onDraftField("excludedCompanies", v)}
            />
          </div>
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Location"
          count={locationValues.length + exLocCount + countryCount}
          defaultOpen
          onClear={() => {
            onDraftField("locations", []);
            onDraftField("excludedLocations", []);
            onDraftField("countries", []);
          }}
        >
          <div className="c360-space-y-3">
            <HsFilterChipList items={chipBuckets.location} variant="section" />
            <HiringSignalTextFacetCombobox
              field="location"
              label="Include locations"
              draft={draft}
              appliedListFilters={appliedListFilters}
              signalTimePreset={signalTimePreset}
              selectedValues={locationValues}
              onSelectionChange={(v) => onDraftField("locations", v)}
            />
            <HiringSignalTextFacetCombobox
              field="location"
              label="Exclude locations"
              draft={draft}
              appliedListFilters={appliedListFilters}
              signalTimePreset={signalTimePreset}
              selectedValues={normalizeHiringSignalTokenList(
                draft.excludedLocations,
              )}
              onSelectionChange={(v) => onDraftField("excludedLocations", v)}
            />
            <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
              Country (ISO code)
            </p>
            <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
              Match jobs whose inferred country overlaps any selected ISO code
              (OR). Choose a country to add it; remove selections with the chips
              above. Duplicates are ignored.
            </p>
            <Select
              id="hsf-country-add"
              value=""
              onChange={(e) => appendCountryCode(e.target.value)}
              options={COUNTRY_ADD_SELECT_OPTIONS}
              fullWidth
              inputSize="md"
            />
          </div>
        </ContactsCollapsibleFilterSection>
        {onTableDensityChange ? (
          <ContactsCollapsibleFilterSection
            title="View"
            count={tableDensity === "compact" ? 1 : 0}
            defaultOpen={false}
            onClear={() => onTableDensityChange("comfortable")}
          >
            <Select
              id="hsf-view-mode"
              value={tableDensity}
              onChange={(e) =>
                onTableDensityChange(
                  e.target.value as "comfortable" | "compact",
                )
              }
              options={VIEW_MODE_OPTIONS}
              fullWidth
              inputSize="md"
            />
          </ContactsCollapsibleFilterSection>
        ) : null}

        <ContactsCollapsibleFilterSection
          title="Date posted"
          count={datePostedCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("datePostedPreset", "any");
            onDraftField("postedAfter", "");
            onDraftField("postedBefore", "");
          }}
        >
          <HsFilterChipList items={chipBuckets.datePosted} variant="section" />
          {signalTimePreset === "new_7d" ? (
            <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
              The Signals &quot;New&quot; tab also enforces jobs from at least
              the last 7 days; the stricter window wins when combined with these
              presets.
            </p>
          ) : null}
          <Select
            id="hsf-date-preset"
            value={draft.datePostedPreset}
            onChange={(e) => onDatePostedPresetChange(e.target.value)}
            options={DATE_POSTED_PRESET_OPTIONS}
            fullWidth
            inputSize="md"
            className="c360-mb-2"
          />
          {draft.datePostedPreset === "custom" ? (
            <div className="c360-mb-3 c360-space-y-2">
              <label
                htmlFor="hsf-posted-after"
                className="c360-block c360-text-2xs c360-text-ink-muted"
              >
                Posted on or after (optional)
              </label>
              <Input
                id="hsf-posted-after"
                type="date"
                value={postedAtBoundToDateInputValue(draft.postedAfter)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    postedAfter: e.target.value.trim(),
                    datePostedPreset: "custom",
                  }))
                }
              />
              <label
                htmlFor="hsf-posted-before"
                className="c360-block c360-text-2xs c360-text-ink-muted"
              >
                Posted on or before (optional)
              </label>
              <Input
                id="hsf-posted-before"
                type="date"
                value={postedAtBoundToDateInputValue(draft.postedBefore)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    postedBefore: e.target.value.trim(),
                    datePostedPreset: "custom",
                  }))
                }
              />
            </div>
          ) : null}
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Experience level"
          count={experienceLevelCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("seniorityPreset", "");
            onDraftField("seniorityCustom", "");
            onDraftField("experienceBuckets", []);
          }}
        >
          <HsFilterChipList
            items={chipBuckets.experienceLevel}
            variant="section"
          />
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Seniority (matches ingested seniority text)
          </p>
          <Select
            id="hsf-seniority-preset"
            value={draft.seniorityPreset}
            onChange={(e) => onDraftField("seniorityPreset", e.target.value)}
            options={SENIORITY_PRESET_OPTIONS}
            fullWidth
            inputSize="md"
            className="c360-mb-3"
          />
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Experience bucket (ingest-derived enum)
          </p>
          <Select
            id="hsf-experience-bucket"
            value={experienceBucketSelectValue}
            onChange={(e) => {
              const v = e.target.value.trim();
              onDraftField("experienceBuckets", v ? [v] : []);
            }}
            options={EXPERIENCE_BUCKET_SELECT_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Job type"
          count={employmentCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("employmentTypes", []);
            onDraftField("employmentType", "");
          }}
        >
          <HsFilterChipList items={chipBuckets.jobType} variant="section" />
          <p className="c360-mb-1 c360-text-2xs c360-text-ink-muted">
            Employment type (substring on ingested employment_type)
          </p>
          <Select
            id="hsf-emp-type"
            value={draft.employmentType}
            onChange={(e) => onDraftField("employmentType", e.target.value)}
            options={EMPLOYMENT_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Remote / workplace"
          count={workplaceCount}
          defaultOpen={false}
          onClear={() => onDraftField("workplaceTypes", [])}
        >
          <HsFilterChipList items={chipBuckets.workplace} variant="section" />
          <Select
            id="hsf-workplace"
            value={workplaceSelectValue}
            onChange={(e) => {
              const v = e.target.value.trim();
              onDraftField("workplaceTypes", v ? [v] : []);
            }}
            options={WORKPLACE_SELECT_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="LinkedIn Apply"
          count={applyMethodCount}
          defaultOpen={false}
          onClear={() => onDraftField("applyMethod", "")}
        >
          <HsFilterChipList
            items={chipBuckets.linkedInApply}
            variant="section"
          />
          <label className="c360-mb-2 c360-flex c360-items-start c360-gap-2 c360-text-2xs">
            <input
              type="checkbox"
              className="c360-mt-0.5"
              checked={draft.applyMethod === EASY_APPLY_METHOD}
              onChange={(e) =>
                onDraftField(
                  "applyMethod",
                  e.target.checked ? EASY_APPLY_METHOD : "",
                )
              }
            />
            <span>
              Easy apply ({EASY_APPLY_METHOD}) — matches ingested apply_method
              (substring).
            </span>
          </label>
          <label className="c360-mb-2 c360-flex c360-items-start c360-gap-2 c360-text-2xs">
            <input
              type="checkbox"
              className="c360-mt-0.5"
              checked={draft.applyMethod === LINKEDIN_APPLY_METHOD}
              onChange={(e) =>
                onDraftField(
                  "applyMethod",
                  e.target.checked ? LINKEDIN_APPLY_METHOD : "",
                )
              }
            />
            <span>
              LinkedIn-hosted apply ({LINKEDIN_APPLY_METHOD}) — matches ingested
              apply_method (substring).
            </span>
          </label>
          <label
            htmlFor="hsf-apply-method"
            className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
          >
            Apply channel (fine-tune)
          </label>
          <Select
            id="hsf-apply-method"
            value={draft.applyMethod}
            onChange={(e) => onDraftField("applyMethod", e.target.value)}
            options={APPLY_METHOD_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Category (Topic)"
          count={industriesCount + exIndCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("industries", []);
            onDraftField("excludedIndustries", []);
          }}
        >
          <HsFilterChipList items={chipBuckets.industries} variant="section" />
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Include category (topic)
          </p>
          <Select
            id="hsf-industry-include"
            value={industryIncludeSelectValue}
            onChange={(e) => {
              const v = e.target.value.trim();
              onDraftField("industries", v ? [v] : []);
            }}
            options={INDUSTRY_SELECT_OPTIONS}
            fullWidth
            inputSize="md"
            className="c360-mb-3"
          />
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Exclude category (topic)
          </p>
          <Select
            id="hsf-industry-exclude"
            value={industryExcludeSelectValue}
            onChange={(e) => {
              const v = e.target.value.trim();
              onDraftField("excludedIndustries", v ? [v] : []);
            }}
            options={INDUSTRY_SELECT_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Job function"
          count={functionCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("functionPreset", "");
            onDraftField("functionCustom", "");
          }}
        >
          <HsFilterChipList items={chipBuckets.jobFunction} variant="section" />
          <Select
            id="hsf-func-preset"
            value={draft.functionPreset}
            onChange={(e) => onDraftField("functionPreset", e.target.value)}
            options={FUNCTION_PRESET_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Education"
          count={eduCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("educationLevelMins", []);
          }}
        >
          <HsFilterChipList
            items={chipBuckets.roleEducation}
            variant="section"
          />
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Minimum education (job posting mentions)
          </p>
          <Select
            id="hsf-education-min"
            value={educationMinSelectValue}
            onChange={(e) => {
              const v = e.target.value.trim();
              onDraftField("educationLevelMins", v ? [v] : []);
            }}
            options={EDUCATION_MIN_SELECT_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Required skills"
          count={skillsCount}
          defaultOpen={false}
          onClear={() => onDraftField("skillsAll", [])}
        >
          <HsFilterChipList items={chipBuckets.skills} variant="section" />
          <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
            Jobs must include every listed skill in ingested tags (AND). Add
            from the list; remove with the chips above. Duplicates are ignored.
          </p>
          <Select
            id="hsf-skill-tag-add"
            value=""
            onChange={(e) => appendSkillTag(e.target.value)}
            options={SKILL_TAG_ADD_SELECT_OPTIONS}
            fullWidth
            inputSize="md"
          />
        </ContactsCollapsibleFilterSection>

        <ContactsCollapsibleFilterSection
          title="Compliance & preferences"
          count={clearanceCount + h1bCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("clearanceMode", "");
            onDraftField("h1bOnly", false);
          }}
        >
          <HsFilterChipList items={chipBuckets.compliance} variant="section" />
          <Select
            id="hsf-clearance"
            value={draft.clearanceMode}
            onChange={(e) => onDraftField("clearanceMode", e.target.value)}
            options={CLEARANCE_OPTIONS}
            fullWidth
            inputSize="md"
          />
          <p className="c360-mt-2 c360-text-2xs c360-text-ink-muted">
            Clearance flags are inferred from job text (see docs).
          </p>
          <label className="c360-mt-3 c360-flex c360-items-center c360-gap-2 c360-text-2xs">
            <input
              type="checkbox"
              checked={draft.h1bOnly}
              onChange={(e) => onDraftField("h1bOnly", e.target.checked)}
            />
            H1B / sponsorship mentioned
          </label>
        </ContactsCollapsibleFilterSection>
        <ContactsCollapsibleFilterSection
          title="Compensation"
          count={salaryCount}
          defaultOpen={false}
          onClear={() => {
            onDraftField("salaryPreset", "");
            onDraftField("salaryMin", "");
            onDraftField("salaryMax", "");
          }}
        >
          <HsFilterChipList
            items={chipBuckets.compensation}
            variant="section"
          />
          <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
            Salary range (USD / year)
          </p>
          <Select
            id="hsf-salary-preset"
            value={draft.salaryPreset}
            onChange={(e) => {
              const v = e.target.value.trim();
              onDraftField("salaryPreset", v);
              if (v !== "custom") {
                onDraftField("salaryMin", "");
                onDraftField("salaryMax", "");
              }
            }}
            options={SALARY_RANGE_PRESET_OPTIONS}
            fullWidth
            inputSize="md"
            className="c360-mb-3"
          />
          {draft.salaryPreset === "custom" ? (
            <>
              <label
                htmlFor="hsf-salary-min"
                className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
              >
                Custom minimum
              </label>
              <Input
                id="hsf-salary-min"
                type="number"
                min={0}
                value={draft.salaryMin}
                onChange={(e) => onDraftField("salaryMin", e.target.value)}
                placeholder="e.g. 80000"
                autoComplete="off"
                className="c360-mb-3"
              />
              <label
                htmlFor="hsf-salary-max"
                className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
              >
                Custom maximum (optional)
              </label>
              <Input
                id="hsf-salary-max"
                type="number"
                min={0}
                value={draft.salaryMax}
                onChange={(e) => onDraftField("salaryMax", e.target.value)}
                placeholder="e.g. 150000"
                autoComplete="off"
              />
            </>
          ) : null}
          <p className="c360-mt-2 c360-text-2xs c360-text-ink-muted">
            Matches parsed salary fields and salary text in postings.
          </p>
        </ContactsCollapsibleFilterSection>
      </div>
    </div>
  );
}

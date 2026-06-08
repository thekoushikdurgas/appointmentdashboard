"use client";

import { useMemo } from "react";
import { useRole } from "@/context/RoleContext";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { HiringSignalCountedSelect } from "@/components/feature/hiring-signals/HiringSignalCountedSelect";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { HsFilterAccordionProvider } from "@/components/feature/hiring-signals/HsFilterAccordionContext";
import { HsFilterSection } from "@/components/feature/hiring-signals/HsFilterSection";
import { HS_FILTER_SECTION_IDS } from "@/components/feature/hiring-signals/hsFilterSectionIds";
import { useHireSignalFilter } from "@/context/HireSignalFilterContext";
import {
  DATE_POSTED_PRESET_LABELS,
  formatSalaryUsdLabel,
  isQuickDatePostedPreset,
  normalizeHiringSignalTokenList,
  postedAtBoundToDateInputValue,
  postedBoundsFromPreset,
  resolveSalaryBoundsFromDraft,
  type DatePostedPreset,
  type HiringSignalFilterDraft,
  type HiringSignalDraftField,
} from "@/components/feature/hiring-signals/hiringSignalFilterDraft";
import { HiringSignalTextFacetCombobox } from "@/components/feature/hiring-signals/HiringSignalTextFacetCombobox";
import { HiringSignalFilterComingSoon } from "@/components/feature/hiring-signals/HiringSignalFilterComingSoon";
import { FilterSidebarBody } from "@/components/layouts/FilterSidebarBody";
import { FilterSidebarHeader } from "@/components/layouts/FilterSidebarHeader";
import { HiringSignalsCompanyFilters } from "@/components/feature/hiring-signals/HiringSignalsCompanyFilters";
import { HiringSignalsDataQualityFilters } from "@/components/feature/hiring-signals/HiringSignalsDataQualityFilters";
import {
  HsFilterChipList,
  type HsFilterChipItem,
} from "@/components/feature/hiring-signals/hsFilterChips";
import {
  HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS,
  HIRE_SIGNAL_COMPANY_COHORT_LABELS,
} from "@/lib/hireSignalCompanyCohort";
import {
  formatCompanyEmployeesCountBucketLabel,
  formatCompanyFundingBucketLabel,
  formatCompanyRevenueBucketLabel,
} from "@/lib/companyRangeBuckets";
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

const APPLY_METHOD_OPTIONS = [
  { value: "", label: "Any" },
  { value: "SimpleOnsiteApply", label: "Easy Apply (Onsite)" },
  { value: "ComplexOnsiteApply", label: "LinkedIn Apply" },
  { value: "OffsiteApply", label: "Company Website / External" },
];

/** Values match job.server ingest `experience_bucket`; labels mirror LinkedIn-style wording. */
const EXPERIENCE_BUCKET_OPTIONS = [
  { value: "intern", label: "Internship" },
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Associate / Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead_staff", label: "Lead / Staff / Principal" },
  { value: "director_exec", label: "Director / Executive" },
];

const EXPERIENCE_BUCKET_SELECT_OPTIONS = [
  { value: "", label: "Any" },
  ...EXPERIENCE_BUCKET_OPTIONS,
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
  { value: "", label: "Add Country…" },
  ...COUNTRY_FILTER_OPTIONS,
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
  { value: "machine learning", label: "Machine Learning" },
  { value: "tensorflow", label: "TensorFlow" },
  { value: "pytorch", label: "PyTorch" },
  { value: "data science", label: "Data Science" },
];

const SKILL_TAG_ADD_SELECT_OPTIONS = [
  { value: "", label: "Add Required Skill…" },
  ...SKILL_TAG_FILTER_OPTIONS,
];

const CLEARANCE_OPTIONS = [
  { value: "", label: "No Clearance Filter" },
  { value: "hide", label: "Hide Clearance-Required" },
  { value: "only", label: "Only Clearance-Required" },
];

const SALARY_RANGE_PRESET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "50000", label: "$50k+" },
  { value: "80000", label: "$80k+" },
  { value: "100000", label: "$100k+" },
  { value: "120000", label: "$120k+" },
  { value: "150000", label: "$150k+" },
  { value: "200000", label: "$200k+" },
  { value: "custom", label: "Custom Range…" },
];

/** Substring match on ingested `seniority_level` (LinkedIn-style titles). */
const SENIORITY_PRESET_OPTIONS = [
  { value: "", label: "Any" },
  { value: "Internship", label: "Internship" },
  { value: "Entry level", label: "Entry Level" },
  { value: "Associate", label: "Associate" },
  { value: "Mid-Senior", label: "Mid-Senior Level" },
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
    { value: "any", label: "Any Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "7d", label: "Last 7 Days" },
    { value: "15d", label: "Last 15 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "custom_range", label: "Custom Range" },
  ];

function clearDatePostedDraftFields(
  onDraftField: (
    field: HiringSignalDraftField,
    value:
      | string
      | string[]
      | boolean
      | number
      | null
      | Record<string, string[]>,
  ) => void,
): void {
  onDraftField("datePostedPreset", "any");
  onDraftField("postedAfter", "");
  onDraftField("postedBefore", "");
}

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

export type { HsFilterChipItem };

export type HsChipBucketKey =
  | "companyCohort"
  | "title"
  | "company"
  | "location"
  | "datePosted"
  | "experienceLevel"
  | "jobType"
  | "linkedInApply"
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
    companyCohort: [],
    title: [],
    company: [],
    location: [],
    datePosted: [],
    experienceLevel: [],
    jobType: [],
    linkedInApply: [],
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
    value: string | string[] | boolean | Record<string, string[]>,
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

  addTokenChips(
    "companyCohort",
    "co-name",
    draft.companyNames,
    "Include Company",
    "companyNames",
  );
  addTokenChips(
    "companyCohort",
    "co-name-ex",
    draft.excludedCompanyNames,
    "Exclude Company",
    "excludedCompanyNames",
  );
  draft.companyRevenue.forEach((raw, i) => {
    const t = raw.trim();
    if (!t) return;
    add("companyCohort", {
      key: `co-rev-${i}-${t}`,
      label: `Include Revenue: ${formatCompanyRevenueBucketLabel(t)}`,
      onRemove: () => {
        onDraftField(
          "companyRevenue",
          draft.companyRevenue.filter((_, j) => j !== i),
        );
      },
    });
  });
  draft.excludedCompanyRevenue.forEach((raw, i) => {
    const t = raw.trim();
    if (!t) return;
    add("companyCohort", {
      key: `co-rev-ex-${i}-${t}`,
      label: `Exclude Revenue: ${formatCompanyRevenueBucketLabel(t)}`,
      onRemove: () => {
        onDraftField(
          "excludedCompanyRevenue",
          draft.excludedCompanyRevenue.filter((_, j) => j !== i),
        );
      },
    });
  });
  draft.companyFunding.forEach((raw, i) => {
    const t = raw.trim();
    if (!t) return;
    add("companyCohort", {
      key: `co-fund-${i}-${t}`,
      label: `Include Funding: ${formatCompanyFundingBucketLabel(t)}`,
      onRemove: () => {
        onDraftField(
          "companyFunding",
          draft.companyFunding.filter((_, j) => j !== i),
        );
      },
    });
  });
  draft.excludedCompanyFunding.forEach((raw, i) => {
    const t = raw.trim();
    if (!t) return;
    add("companyCohort", {
      key: `co-fund-ex-${i}-${t}`,
      label: `Exclude Funding: ${formatCompanyFundingBucketLabel(t)}`,
      onRemove: () => {
        onDraftField(
          "excludedCompanyFunding",
          draft.excludedCompanyFunding.filter((_, j) => j !== i),
        );
      },
    });
  });
  addTokenChips(
    "companyCohort",
    "co-country",
    draft.companyCountries,
    "Include Country",
    "companyCountries",
  );
  addTokenChips(
    "companyCohort",
    "co-country-ex",
    draft.excludedCompanyCountries,
    "Exclude Country",
    "excludedCompanyCountries",
  );
  addTokenChips(
    "companyCohort",
    "co-industry",
    draft.companyIndustries,
    "Include Industry",
    "companyIndustries",
  );
  addTokenChips(
    "companyCohort",
    "co-industry-ex",
    draft.excludedCompanyIndustries,
    "Exclude Industry",
    "excludedCompanyIndustries",
  );
  draft.companyEmployeeSizes.forEach((raw, i) => {
    const t = raw.trim();
    if (!t) return;
    add("companyCohort", {
      key: `co-emp-size-${i}-${t}`,
      label: `Include Employee Size: ${formatCompanyEmployeesCountBucketLabel(t)}`,
      onRemove: () => {
        onDraftField(
          "companyEmployeeSizes",
          draft.companyEmployeeSizes.filter((_, j) => j !== i),
        );
      },
    });
  });
  draft.excludedCompanyEmployeeSizes.forEach((raw, i) => {
    const t = raw.trim();
    if (!t) return;
    add("companyCohort", {
      key: `co-emp-size-ex-${i}-${t}`,
      label: `Exclude Employee Size: ${formatCompanyEmployeesCountBucketLabel(t)}`,
      onRemove: () => {
        onDraftField(
          "excludedCompanyEmployeeSizes",
          draft.excludedCompanyEmployeeSizes.filter((_, j) => j !== i),
        );
      },
    });
  });
  for (const key of HIRE_SIGNAL_COMPANY_COHORT_FACET_KEYS) {
    const vals = draft.companyFacetValues[key] ?? [];
    const labelPrefix =
      HIRE_SIGNAL_COMPANY_COHORT_LABELS[key] ?? String(key).replace(/_/g, " ");
    vals.forEach((raw, i) => {
      const t = raw.trim();
      if (!t) return;
      add("companyCohort", {
        key: `co-facet-${key}-${i}`,
        label: `${labelPrefix}: ${t}`,
        onRemove: () => {
          const cur = draft.companyFacetValues[key] ?? [];
          onDraftField("companyFacetValues", {
            ...draft.companyFacetValues,
            [key]: cur.filter((_, j) => j !== i),
          });
        },
      });
    });
  }

  addTokenChips("title", "title", draft.titles, "Title", "titles");
  addTokenChips("location", "loc", draft.locations, "Location", "locations");
  addTokenChips(
    "title",
    "exti",
    draft.excludedTitles,
    "Exclude Title",
    "excludedTitles",
  );
  addTokenChips(
    "location",
    "exloc",
    draft.excludedLocations,
    "Exclude Location",
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
      label: `Employment Type: ${draft.employmentType}`,
      onRemove: () => onDraftField("employmentType", ""),
    });
  }
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
  addTokenChips("skills", "sk", draft.skillsAll, "Required Skill", "skillsAll");
  addTokenChips("location", "ctry", draft.countries, "Country", "countries");

  if (draft.applyMethod.trim()) {
    add("linkedInApply", {
      key: "applym",
      label:
        draft.applyMethod === LINKEDIN_APPLY_METHOD
          ? "LinkedIn Apply (Hosted)"
          : draft.applyMethod === EASY_APPLY_METHOD
            ? "Easy Apply (LinkedIn)"
            : `Apply Method: ${draft.applyMethod}`,
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
            : `Salary: Up to ${formatSalaryUsdLabel(salaryMax!)}`;
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
      label: "Clearance: Hide Required",
      onRemove: () => onDraftField("clearanceMode", ""),
    });
  }
  if (draft.clearanceMode.trim() === "only") {
    add("compliance", {
      key: "clo",
      label: "Clearance: Only Required",
      onRemove: () => onDraftField("clearanceMode", ""),
    });
  }

  if (draft.h1bOnly) {
    add("compliance", {
      key: "h1b",
      label: "H1B / Sponsorship Mention",
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
      label: `Department: ${s}`,
      onRemove: () => {
        onDraftField("functionPreset", "");
        onDraftField("functionCustom", "");
      },
    });
  }
  if (draft.datePostedPreset !== "any") {
    const pk = draft.datePostedPreset;
    const label =
      pk === "custom_range"
        ? `Date Posted: ${[
          postedAtBoundToDateInputValue(draft.postedAfter),
          postedAtBoundToDateInputValue(draft.postedBefore),
        ]
          .filter(Boolean)
          .join(" – ") || "Custom Range"
        }`
        : `Date Posted: ${DATE_POSTED_PRESET_LABELS[pk]}`;
    add("datePosted", {
      key: "dpreset",
      label,
      onRemove: () => {
        onDraftField("datePostedPreset", "any");
        onDraftField("postedAfter", "");
        onDraftField("postedBefore", "");
      },
    });
  }

  return b;
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
  /** Saved searches, clear, and other header actions. */
  headerActions?: React.ReactNode;
  companyCohortResolving?: boolean;
  companyCohortMatchTotal?: number | null;
  companyCohortTruncated?: boolean;
}

export function HiringSignalsFilterSidebar({
  appliedListFilters,
  signalTimePreset,
  appliedRunId,
  runScopedJobTotal,
  onClearRunId,
  className,
  headerActions,
  companyCohortResolving = false,
  companyCohortMatchTotal = null,
  companyCohortTruncated = false,
}: HiringSignalsFilterSidebarProps) {
  const { isAdmin, isSuperAdmin } = useRole();
  const canUseAdvancedJobFilters = isAdmin || isSuperAdmin;
  const { draft, onDraftField, setDraft } = useHireSignalFilter();

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

  const totalActiveCount = useMemo(() => {
    let n = 0;
    for (const items of Object.values(chipBuckets)) {
      n += items.length;
    }
    if (appliedRunId?.trim() && onClearRunId) n += 1;
    return n;
  }, [chipBuckets, appliedRunId, onClearRunId]);

  const hasRunChip = Boolean(appliedRunId?.trim() && onClearRunId);

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
  const locationValues = normalizeHiringSignalTokenList(draft.locations);
  const seniorityCount =
    draft.seniorityPreset.trim() || draft.seniorityCustom.trim() ? 1 : 0;
  const functionCount =
    draft.functionPreset.trim() || draft.functionCustom.trim() ? 1 : 0;

  const employmentCount =
    normalizeHiringSignalTokenList(draft.employmentTypes).length +
    (draft.employmentType.trim() ? 1 : 0);
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
  const exTitleCount = normalizeHiringSignalTokenList(
    draft.excludedTitles,
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
      clearDatePostedDraftFields(onDraftField);
      return;
    }
    if (v === "custom_range") {
      onDraftField("datePostedPreset", "custom_range");
      return;
    }
    if (isQuickDatePostedPreset(v)) {
      const bounds = postedBoundsFromPreset(v);
      onDraftField("datePostedPreset", v);
      onDraftField("postedAfter", bounds.postedAfter);
      onDraftField("postedBefore", bounds.postedBefore);
    }
  };

  return (
    <div
      className={cn("c360-contacts-filters c360-hs-filters", className)}
    >
      <div data-tour="hs-filter-sidebar-head">
        <FilterSidebarHeader
          activeCount={totalActiveCount}
          headerActions={headerActions}
          showHeadText={false}
        />
      </div>

      <FilterSidebarBody>
        {hasRunChip ? (
          <div className="c360-hs-filters__run-row c360-mb-2">
            <div className="c360-hs-filter-chips c360-hs-filter-chips--run">
              {runChip}
            </div>
          </div>
        ) : null}

        <HsFilterAccordionProvider>
          <div className="c360-hs-filters__sections">
            <HiringSignalsCompanyFilters
              appliedListFilters={appliedListFilters}
              signalTimePreset={signalTimePreset}
              companyCohortResolving={companyCohortResolving}
              companyCohortMatchTotal={companyCohortMatchTotal}
              companyCohortTruncated={companyCohortTruncated}
              companyFilterChips={chipBuckets.companyCohort}
            />

            {isSuperAdmin ? <HiringSignalsDataQualityFilters /> : null}

            <h3 className="c360-hs-filters__group-header">Job Filters</h3>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.jobTitle}
              title="Title"
              count={titleValues.length + exTitleCount}
              onClear={() => {
                onDraftField("titles", []);
                onDraftField("excludedTitles", []);
              }}
            >
              <div className="c360-space-y-3">
                <HsFilterChipList items={chipBuckets.title} variant="section" />
                <HiringSignalTextFacetCombobox
                  field="title"
                  label="Include Job Titles"
                  draft={draft}
                  appliedListFilters={appliedListFilters}
                  signalTimePreset={signalTimePreset}
                  selectedValues={titleValues}
                  onSelectionChange={(v) => onDraftField("titles", v)}
                />
                <HiringSignalTextFacetCombobox
                  field="title"
                  label="Exclude Job Titles"
                  draft={draft}
                  appliedListFilters={appliedListFilters}
                  signalTimePreset={signalTimePreset}
                  selectedValues={normalizeHiringSignalTokenList(
                    draft.excludedTitles,
                  )}
                  onSelectionChange={(v) => onDraftField("excludedTitles", v)}
                />
              </div>
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.jobLocation}
              title="Location"
              count={locationValues.length + exLocCount + countryCount}
              onClear={() => {
                onDraftField("locations", []);
                onDraftField("excludedLocations", []);
                onDraftField("countries", []);
              }}
            >
              <div className="c360-space-y-3">
                <HsFilterChipList
                  items={chipBuckets.location}
                  variant="section"
                />
                <HiringSignalTextFacetCombobox
                  field="location"
                  label="Include Locations"
                  draft={draft}
                  appliedListFilters={appliedListFilters}
                  signalTimePreset={signalTimePreset}
                  selectedValues={locationValues}
                  onSelectionChange={(v) => onDraftField("locations", v)}
                />
                <HiringSignalTextFacetCombobox
                  field="location"
                  label="Exclude Locations"
                  draft={draft}
                  appliedListFilters={appliedListFilters}
                  signalTimePreset={signalTimePreset}
                  selectedValues={normalizeHiringSignalTokenList(
                    draft.excludedLocations,
                  )}
                  onSelectionChange={(v) =>
                    onDraftField("excludedLocations", v)
                  }
                />
                <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
                  Country (ISO Code)
                </p>
                <HiringSignalCountedSelect
                  field="job_country"
                  appliedListFilters={appliedListFilters}
                  signalTimePreset={signalTimePreset}
                  id="hsf-country-add"
                  value=""
                  onChange={(e) => appendCountryCode(e.target.value)}
                  staticOptions={COUNTRY_ADD_SELECT_OPTIONS}
                  fullWidth
                  inputSize="md"
                />
              </div>
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.datePosted}
              title="Date Posted"
              count={datePostedCount}
              onClear={() => clearDatePostedDraftFields(onDraftField)}
            >
              <HsFilterChipList
                items={chipBuckets.datePosted}
                variant="section"
              />
              {signalTimePreset === "new_7d" ? (
                <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
                  The Signals &quot;Today&apos;s Jobs&quot; tab filters to jobs
                  posted today (local time) when no Date Posted sidebar preset
                  is active; sidebar date filters override the tab window.
                </p>
              ) : null}
              <Select
                menuVariant="inline"
                id="hsf-date-preset"
                value={draft.datePostedPreset}
                onChange={(e) => onDatePostedPresetChange(e.target.value)}
                options={DATE_POSTED_PRESET_OPTIONS}
                fullWidth
                inputSize="md"
                className="c360-mb-2"
              />
              {draft.datePostedPreset === "custom_range" ? (
                <div className="c360-mb-3 c360-space-y-2">
                  <label
                    htmlFor="hsf-posted-after"
                    className="c360-block c360-text-2xs c360-text-ink-muted"
                  >
                    From (Optional)
                  </label>
                  <Input
                    id="hsf-posted-after"
                    type="date"
                    value={postedAtBoundToDateInputValue(draft.postedAfter)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        postedAfter: e.target.value.trim(),
                        datePostedPreset: "custom_range",
                      }))
                    }
                  />
                  <label
                    htmlFor="hsf-posted-before"
                    className="c360-block c360-text-2xs c360-text-ink-muted"
                  >
                    To (Optional)
                  </label>
                  <Input
                    id="hsf-posted-before"
                    type="date"
                    value={postedAtBoundToDateInputValue(draft.postedBefore)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        postedBefore: e.target.value.trim(),
                        datePostedPreset: "custom_range",
                      }))
                    }
                  />
                </div>
              ) : null}
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.experienceLevel}
              title="Experience Level"
              count={experienceLevelCount}
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
                Seniority (Matches Ingested Seniority Text)
              </p>
              <HiringSignalCountedSelect
                field="seniority"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                id="hsf-seniority-preset"
                value={draft.seniorityPreset}
                onChange={(e) =>
                  onDraftField("seniorityPreset", e.target.value)
                }
                staticOptions={SENIORITY_PRESET_OPTIONS}
                fullWidth
                inputSize="md"
                className="c360-mb-3"
              />
              <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
                Experience Bucket (Ingest-Derived Enum)
              </p>
              <HiringSignalCountedSelect
                field="experience_bucket"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                id="hsf-experience-bucket"
                value={experienceBucketSelectValue}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  onDraftField("experienceBuckets", v ? [v] : []);
                }}
                staticOptions={EXPERIENCE_BUCKET_SELECT_OPTIONS}
                fullWidth
                inputSize="md"
              />
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.jobType}
              title="Job Type"
              count={employmentCount}
              onClear={() => {
                onDraftField("employmentTypes", []);
                onDraftField("employmentType", "");
              }}
            >
              <HsFilterChipList items={chipBuckets.jobType} variant="section" />
              <p className="c360-mb-1 c360-text-2xs c360-text-ink-muted">
                Employment Type (Substring on Ingested employment_type)
              </p>
              <HiringSignalCountedSelect
                field="employment_type"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                id="hsf-emp-type"
                value={draft.employmentType}
                onChange={(e) => onDraftField("employmentType", e.target.value)}
                staticOptions={EMPLOYMENT_OPTIONS}
                fullWidth
                inputSize="md"
              />
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.linkedinApply}
              title="LinkedIn Apply"
              count={applyMethodCount}
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
                  Easy Apply ({EASY_APPLY_METHOD}) — matches ingested
                  apply_method (substring).
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
                  LinkedIn-Hosted Apply ({LINKEDIN_APPLY_METHOD}) — matches
                  ingested apply_method (substring).
                </span>
              </label>
              <label
                htmlFor="hsf-apply-method"
                className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
              >
                Apply Channel (Fine-Tune)
              </label>
              <HiringSignalCountedSelect
                field="apply_method"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                id="hsf-apply-method"
                value={draft.applyMethod}
                onChange={(e) => onDraftField("applyMethod", e.target.value)}
                staticOptions={APPLY_METHOD_OPTIONS}
                fullWidth
                inputSize="md"
              />
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.jobFunction}
              title="Job Department"
              count={functionCount}
              onClear={() => {
                onDraftField("functionPreset", "");
                onDraftField("functionCustom", "");
              }}
            >
              <HsFilterChipList
                items={chipBuckets.jobFunction}
                variant="section"
              />
              <HiringSignalCountedSelect
                field="function_category"
                appliedListFilters={appliedListFilters}
                signalTimePreset={signalTimePreset}
                id="hsf-func-preset"
                value={draft.functionPreset}
                onChange={(e) => onDraftField("functionPreset", e.target.value)}
                staticOptions={FUNCTION_PRESET_OPTIONS}
                fullWidth
                inputSize="md"
              />
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.education}
              title="Education"
              count={eduCount}
              onClear={() => {
                onDraftField("educationLevelMins", []);
              }}
            >
              <div className="c360-space-y-3">
                <HsFilterChipList
                  items={chipBuckets.roleEducation}
                  variant="section"
                />
                {canUseAdvancedJobFilters ? (
                  <>
                    <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
                      Minimum Education (Job Posting Mentions)
                    </p>
                    <HiringSignalCountedSelect
                      field="education_level_min"
                      appliedListFilters={appliedListFilters}
                      signalTimePreset={signalTimePreset}
                      id="hsf-education-min"
                      value={educationMinSelectValue}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        onDraftField("educationLevelMins", v ? [v] : []);
                      }}
                      staticOptions={EDUCATION_MIN_SELECT_OPTIONS}
                      fullWidth
                      inputSize="md"
                    />
                  </>
                ) : (
                  <HiringSignalFilterComingSoon featureLabel="Education" />
                )}
              </div>
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.requiredSkills}
              title="Required Skills"
              count={skillsCount}
              onClear={() => onDraftField("skillsAll", [])}
            >
              <div className="c360-space-y-3">
                <HsFilterChipList
                  items={chipBuckets.skills}
                  variant="section"
                />
                {canUseAdvancedJobFilters ? (
                  <>
                    <p className="c360-mb-2 c360-text-2xs c360-text-ink-muted">
                      Jobs must include every listed skill in ingested tags
                      (AND). Add from the list; remove with the chips above.
                      Duplicates are ignored.
                    </p>
                    <HiringSignalCountedSelect
                      field="skill_tag"
                      appliedListFilters={appliedListFilters}
                      signalTimePreset={signalTimePreset}
                      id="hsf-skill-tag-add"
                      value=""
                      onChange={(e) => appendSkillTag(e.target.value)}
                      staticOptions={SKILL_TAG_ADD_SELECT_OPTIONS}
                      fullWidth
                      inputSize="md"
                    />
                  </>
                ) : (
                  <HiringSignalFilterComingSoon featureLabel="Required Skills" />
                )}
              </div>
            </HsFilterSection>

            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.compliancePreferences}
              title="Compliance & Preferences"
              count={clearanceCount + h1bCount}
              onClear={() => {
                onDraftField("clearanceMode", "");
                onDraftField("h1bOnly", false);
              }}
            >
              <div className="c360-space-y-3">
                <HsFilterChipList
                  items={chipBuckets.compliance}
                  variant="section"
                />
                {canUseAdvancedJobFilters ? (
                  <>
                    <HiringSignalCountedSelect
                      field="clearance_mode"
                      appliedListFilters={appliedListFilters}
                      signalTimePreset={signalTimePreset}
                      id="hsf-clearance"
                      value={draft.clearanceMode}
                      onChange={(e) =>
                        onDraftField("clearanceMode", e.target.value)
                      }
                      staticOptions={CLEARANCE_OPTIONS}
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
                        onChange={(e) =>
                          onDraftField("h1bOnly", e.target.checked)
                        }
                      />
                      H1B / Sponsorship Mentioned
                    </label>
                  </>
                ) : (
                  <HiringSignalFilterComingSoon featureLabel="Compliance & Preferences" />
                )}
              </div>
            </HsFilterSection>
            <HsFilterSection
              sectionId={HS_FILTER_SECTION_IDS.compensation}
              title="Compensation"
              count={salaryCount}
              onClear={
                salaryCount > 0
                  ? () => {
                    onDraftField("salaryPreset", "");
                    onDraftField("salaryMin", "");
                    onDraftField("salaryMax", "");
                  }
                  : undefined
              }
            >
              <div className="c360-space-y-3">
                <HsFilterChipList
                  items={chipBuckets.compensation}
                  variant="section"
                />
                {canUseAdvancedJobFilters ? (
                  <>
                    <p className="c360-mb-1 c360-text-2xs c360-font-medium c360-text-ink-muted">
                      Salary Range (USD / Year)
                    </p>
                    <Select
                      menuVariant="inline"
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
                          Custom Minimum
                        </label>
                        <Input
                          id="hsf-salary-min"
                          type="number"
                          min={0}
                          value={draft.salaryMin}
                          onChange={(e) =>
                            onDraftField("salaryMin", e.target.value)
                          }
                          placeholder="e.g. 80000"
                          autoComplete="off"
                          className="c360-mb-3"
                        />
                        <label
                          htmlFor="hsf-salary-max"
                          className="c360-mb-1 c360-block c360-text-2xs c360-text-ink-muted"
                        >
                          Custom Maximum (Optional)
                        </label>
                        <Input
                          id="hsf-salary-max"
                          type="number"
                          min={0}
                          value={draft.salaryMax}
                          onChange={(e) =>
                            onDraftField("salaryMax", e.target.value)
                          }
                          placeholder="e.g. 150000"
                          autoComplete="off"
                        />
                      </>
                    ) : null}
                    <p className="c360-mt-2 c360-text-2xs c360-text-ink-muted">
                      Matches parsed salary fields and salary text in postings.
                    </p>
                  </>
                ) : (
                  <HiringSignalFilterComingSoon featureLabel="Compensation" />
                )}
              </div>
            </HsFilterSection>
          </div>
        </HsFilterAccordionProvider>
      </FilterSidebarBody>
    </div>
  );
}

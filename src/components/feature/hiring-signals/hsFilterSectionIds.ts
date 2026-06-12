export { nextFilterOpenSectionId as nextHsFilterOpenSectionId } from "@/components/layouts/filters/FilterAccordionContext";

/** Stable accordion section ids for the Hiring Signals filter sidebar. */
export const HS_FILTER_SECTION_IDS = {
  companyName: "company-name",
  companyCountry: "company-country",
  companyIndustry: "company-industry",
  companyEmployeeSize: "company-employee-size",
  companyRevenue: "company-revenue",
  companyFunding: "company-funding",
  dataQuality: "data-quality",
  jobTitle: "job-title",
  jobLocation: "job-location",
  datePosted: "date-posted",
  experienceLevel: "experience-level",
  jobType: "job-type",
  linkedinApply: "linkedin-apply",
  jobFunction: "job-function",
  education: "education",
  requiredSkills: "required-skills",
  compliancePreferences: "compliance-preferences",
  compensation: "compensation",
} as const;

export type HsFilterSectionId =
  (typeof HS_FILTER_SECTION_IDS)[keyof typeof HS_FILTER_SECTION_IDS];

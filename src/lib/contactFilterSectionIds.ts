/** Stable accordion section ids for the Contacts filter sidebar. */
export const CONTACT_FILTER_SECTION_IDS = {
  sort: "meta-sort",
  view: "meta-view",
  personFirstName: "person-first-name",
  personLastName: "person-last-name",
  personTitle: "person-title",
  personSeniority: "person-seniority",
  personDepartments: "person-departments",
  personCity: "person-city",
  personState: "person-state",
  personCountry: "person-country",
  personLinkedin: "person-linkedin",
  personMobile: "person-mobile",
  personStage: "person-stage",
  email: "email",
  emailStatus: "email-status",
  scoreAi: "score-ai",
  scoreLead: "score-lead",
  coName: "co-name",
  coAddress: "co-address",
  coCity: "co-city",
  coState: "co-state",
  coCountry: "co-country",
  coIndustries: "co-industries",
  coKeywords: "co-keywords",
  coTechnologies: "co-technologies",
  coWebsite: "co-website",
  coLinkedin: "co-linkedin",
  coDomain: "co-domain",
  coEmployees: "co-employees",
  coRevenue: "co-revenue",
  coFunding: "co-funding",
  columns: "meta-columns",
  advanced: "meta-advanced",
} as const;

export type ContactFilterSectionId =
  (typeof CONTACT_FILTER_SECTION_IDS)[keyof typeof CONTACT_FILTER_SECTION_IDS];

/** Maps API `filterKey` → stable accordion section id. */
export const CONTACT_FILTER_KEY_TO_SECTION_ID: Record<string, string> = {
  first_name: CONTACT_FILTER_SECTION_IDS.personFirstName,
  last_name: CONTACT_FILTER_SECTION_IDS.personLastName,
  title: CONTACT_FILTER_SECTION_IDS.personTitle,
  seniority: CONTACT_FILTER_SECTION_IDS.personSeniority,
  departments: CONTACT_FILTER_SECTION_IDS.personDepartments,
  city: CONTACT_FILTER_SECTION_IDS.personCity,
  state: CONTACT_FILTER_SECTION_IDS.personState,
  country: CONTACT_FILTER_SECTION_IDS.personCountry,
  linkedin_url: CONTACT_FILTER_SECTION_IDS.personLinkedin,
  mobile_phone: CONTACT_FILTER_SECTION_IDS.personMobile,
  stage: CONTACT_FILTER_SECTION_IDS.personStage,
  email: CONTACT_FILTER_SECTION_IDS.email,
  email_status: CONTACT_FILTER_SECTION_IDS.emailStatus,
  ai_score: CONTACT_FILTER_SECTION_IDS.scoreAi,
  lead_score: CONTACT_FILTER_SECTION_IDS.scoreLead,
  company_name: CONTACT_FILTER_SECTION_IDS.coName,
  company_address: CONTACT_FILTER_SECTION_IDS.coAddress,
  company_city: CONTACT_FILTER_SECTION_IDS.coCity,
  company_state: CONTACT_FILTER_SECTION_IDS.coState,
  company_country: CONTACT_FILTER_SECTION_IDS.coCountry,
  company_industries: CONTACT_FILTER_SECTION_IDS.coIndustries,
  company_keywords: CONTACT_FILTER_SECTION_IDS.coKeywords,
  company_technologies: CONTACT_FILTER_SECTION_IDS.coTechnologies,
  company_website: CONTACT_FILTER_SECTION_IDS.coWebsite,
  company_linkedin_url: CONTACT_FILTER_SECTION_IDS.coLinkedin,
  company_normalized_domain: CONTACT_FILTER_SECTION_IDS.coDomain,
  company_employees_count: CONTACT_FILTER_SECTION_IDS.coEmployees,
  company_annual_revenue: CONTACT_FILTER_SECTION_IDS.coRevenue,
  company_total_funding: CONTACT_FILTER_SECTION_IDS.coFunding,
};

export type ContactFilterGroupId = "person" | "email" | "scores" | "company";

export const CONTACT_FILTER_GROUPS: Array<{
  id: ContactFilterGroupId;
  label: string;
  filterKeys: string[];
}> = [
  {
    id: "person",
    label: "Person",
    filterKeys: [
      "first_name",
      "last_name",
      "title",
      "seniority",
      "departments",
      "city",
      "state",
      "country",
      "linkedin_url",
      "mobile_phone",
      "stage",
    ],
  },
  {
    id: "email",
    label: "Email & status",
    filterKeys: ["email", "email_status"],
  },
  {
    id: "scores",
    label: "Scores",
    filterKeys: ["ai_score", "lead_score"],
  },
  {
    id: "company",
    label: "Company on contact",
    filterKeys: [
      "company_name",
      "company_address",
      "company_city",
      "company_state",
      "company_country",
      "company_industries",
      "company_keywords",
      "company_technologies",
      "company_website",
      "company_linkedin_url",
      "company_normalized_domain",
      "company_employees_count",
      "company_annual_revenue",
      "company_total_funding",
    ],
  },
];

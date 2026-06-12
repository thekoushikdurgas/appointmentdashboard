# Entity filter sidebar — UX spec

Aligns Companies and Contacts filter sidebars with Hiring Signals patterns: grouped sections, single-expand accordion, hybrid global + per-section chips, consistent header/rail behavior. Does **not** change VQL/facet data pipelines.

## Search placement

| Page               | Decision                                 | Rationale                                                                                              |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Companies**      | Keep search in sidebar                   | Primary use case is firmographic browse; sidebar search is established and pairs with global chip row. |
| **Contacts**       | Keep email search in Email facet section | No global person search API today; email `contains` lives in facet. Toolbar tabs handle list scope.    |
| **Hiring Signals** | Toolbar global search (unchanged)        | Reference implementation.                                                                              |

## Companies — facet groups

| Group              | `filterKey` values                                     | Section IDs (`companyFilterSectionIds.ts`)                              |
| ------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Identity**       | `uuid`, `website`, `linkedin_url`, `normalized_domain` | `company-name`, `company-website`, `company-linkedin`, `company-domain` |
| **Firmographics**  | `employees_count`, `annual_revenue`, `total_funding`   | `company-employees`, `company-revenue`, `company-funding`               |
| **Classification** | `industries`, `keywords`, `technologies`               | `company-industries`, `company-keywords`, `company-technologies`        |
| **Location**       | `address`, `city`, `state`, `country`                  | `company-address`, `company-city`, `company-state`, `company-country`   |

**Default open section:** `company-name` (Identity → Name).

**Meta sections (outside groups):** Sort, View, Columns, Advanced VQL.

## Contacts — facet groups

| Group                  | `filterKey` values                                                                                                                                                                                                                                                                                            | Section IDs (`contactFilterSectionIds.ts`) |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **Person**             | `first_name`, `last_name`, `title`, `seniority`, `departments`, `city`, `state`, `country`, `linkedin_url`, `mobile_phone`, `stage`                                                                                                                                                                           | `person-first-name`, … `person-stage`      |
| **Email & status**     | `email`, `email_status`                                                                                                                                                                                                                                                                                       | `email`, `email-status`                    |
| **Scores**             | `ai_score`, `lead_score`                                                                                                                                                                                                                                                                                      | `score-ai`, `score-lead`                   |
| **Company on contact** | `company_name`, `company_address`, `company_city`, `company_state`, `company_country`, `company_industries`, `company_keywords`, `company_technologies`, `company_website`, `company_linkedin_url`, `company_normalized_domain`, `company_employees_count`, `company_annual_revenue`, `company_total_funding` | `co-name`, … `co-funding`                  |

**List scope:** Toolbar tabs Total / Net New / Do Not Contact (`activeTab`); not a sidebar accordion section.

**Default open section:** `person-title`.

**Meta sections:** Sort, View, Columns, Advanced VQL.

## Shared UX patterns

1. **Single-expand accordion** — `FilterAccordionProvider`; one facet/meta section open at a time.
2. **Global chip row** — summary of all active filters at top of `FilterSidebarBody`.
3. **Per-section chips** — inside each expanded accordion section.
4. **Group headers** — `FilterGroupHeader` between facet groups.
5. **Header** — `FilterSidebarHeader` with `showHeadText={false}` on entity pages; `railActions` refresh on Companies and Contacts.
6. **Clear all** — resets search, sort, facets, VQL, list scope (contacts), columns unchanged unless chip removed.

## CSS

Root class: `c360-contacts-filters c360-entity-filters` (+ `c360-companies-filters` on companies page).

Shared tokens: `.c360-entity-filters__group-header`, `.c360-entity-filters__chips`, `.c360-entity-filters__chip` in `19-contacts-and-sequences.css`.

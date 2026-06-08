import type { TourStep } from "@/components/shared/OnboardingTour";
import { ROUTES } from "@/lib/routes";

/**
 * Default onboarding tour: welcome → dashboard → hiring signals deep-dive → billing.
 */
export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Contact360!",
    content:
      "Let's take a quick tour of the key features. You can skip at any time and restart later from your profile settings.",
  },
  {
    id: "dashboard",
    route: ROUTES.DASHBOARD,
    target: "a.c360-sidebar__item[href='/dashboard']",
    title: "Dashboard",
    content:
      "Your command center. See live stats, activity streams, and product highlights at a glance.",
    position: "right",
  },
  {
    id: "hiring-signals",
    route: ROUTES.HIRING_SIGNALS,
    target: "a.c360-sidebar__item[href='/hiring-signals']",
    title: "Hiring signals",
    content:
      "Browse live job postings scraped from LinkedIn. Filter, export, and open company intelligence for each role.",
    position: "right",
  },
  {
    id: "hs-filters",
    route: ROUTES.HIRING_SIGNALS,
    prepare: "hs-open-filters",
    target: '[data-tour="hs-filter-sidebar-head"]',
    title: "Filter sidebar",
    content:
      "Use facets for company, role, location, salary, and data quality. Pin the panel open or collapse it to a hover rail.",
    position: "right",
  },
  {
    id: "hs-job-list",
    route: ROUTES.HIRING_SIGNALS,
    target: ".c360-hs-toolbar-stack .c360-toolbar__tabs",
    title: "Job list",
    content:
      "Sort and paginate hiring signals. Open job descriptions, company drawers, or Connectra people for any row.",
    position: "bottom",
  },
  {
    id: "hs-contacts-panel",
    route: ROUTES.HIRING_SIGNALS,
    prepare: "hs-open-connectra",
    target: '[data-tour="hs-contacts-panel-head"]',
    title: "Company contacts",
    content:
      "The right panel lists people at the hiring company from Connectra. Filter by title or department and export CSV.",
    position: "left",
  },
  {
    id: "hs-email-notify",
    route: ROUTES.HIRING_SIGNALS,
    prepare: "hs-open-saved-searches",
    target: '[data-tour="hs-email-save-btn"]',
    title: "Email notifications",
    content:
      "Save your filter set and subscribe to email alerts when new jobs match — daily digests or instant new-job notifications.",
    position: "left",
  },
  {
    id: "billing",
    route: ROUTES.BILLING,
    routeMatch: "prefix",
    prepare: "hs-close-panels",
    target: '[data-tour="billing-plans"]',
    title: "Billing",
    content:
      "Upgrade your plan, view invoices, and track your credit history — all in one place.",
    position: "bottom",
  },
];

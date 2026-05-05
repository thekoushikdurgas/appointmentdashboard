import { ROUTES, activitiesTabRoute } from "@/lib/routes";
import { FILES_DRAWER_NAV_HREF } from "@/context/FilesDrawerContext";

/** Carousel slide shaped for `CircularTestimonials` — mirrors legacy `AD_SLIDE_SPECS` copy and targets. */
export interface CircularTestimonial {
  id: string;
  quote: string;
  name: string;
  designation: string;
  src: string;
  /** Link label + target (omit both when using testimonials as plain quotes only). */
  cta?: string;
  href?: string;
}

/** Stable portrait crops via picsum seeds (next/image: hostname allowed in next.config). */
function slideImage(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/1000`;
}

export const DASHBOARD_DEMO_TESTIMONIALS: CircularTestimonial[] = [
  {
    id: "crm-contacts",
    name: "Contacts & VQL",
    designation: "contact360.io",
    quote:
      "Filter with advanced VQL, manage columns, and use saved list views for repeat work.",
    href: ROUTES.CONTACTS,
    cta: "Open contacts",
    src: slideImage("c360-crm-contacts"),
  },
  {
    id: "companies",
    name: "Company database",
    designation: "contact360.io",
    quote:
      "Search companies, use facets, and keep org records aligned with your contact lists.",
    href: ROUTES.COMPANIES,
    cta: "Open companies",
    src: slideImage("c360-companies"),
  },
  {
    id: "email-tools",
    name: "Email finder & verify",
    designation: "contact360.io",
    quote:
      "Find addresses, run bulk jobs, and verify deliverability before you send.",
    href: ROUTES.EMAIL,
    cta: "Email tools",
    src: slideImage("c360-email-tools"),
  },
  {
    id: "phone",
    name: "Phone intelligence",
    designation: "contact360.io",
    quote:
      "Find and validate phone numbers alongside your contact and company data.",
    href: ROUTES.PHONE,
    cta: "Phone tools",
    src: slideImage("c360-phone"),
  },
  {
    id: "campaigns",
    name: "Campaigns & sequences",
    designation: "contact360.io",
    quote:
      "Build campaigns, templates, and multi-step sequences from one hub.",
    href: ROUTES.CAMPAIGNS,
    cta: "Campaigns",
    src: slideImage("c360-campaigns"),
  },
  {
    id: "hiring-signals",
    name: "Hiring signals",
    designation: "contact360.io",
    quote:
      "Track job and hiring signals to prioritize outreach to the right orgs.",
    href: ROUTES.HIRING_SIGNALS,
    cta: "Hiring signals",
    src: slideImage("c360-hiring-signals"),
  },
  {
    id: "files",
    name: "Files & storage",
    designation: "contact360.io",
    quote:
      "Upload files, run batch flows, and keep assets tied to your workspace.",
    href: FILES_DRAWER_NAV_HREF,
    cta: "Open files",
    src: slideImage("c360-files"),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    designation: "contact360.io",
    quote:
      "Export and work with LinkedIn data alongside your CRM in Contact360.",
    href: ROUTES.LINKEDIN,
    cta: "LinkedIn",
    src: slideImage("c360-linkedin"),
  },
  {
    id: "activity-usage",
    name: "Activity & usage",
    designation: "contact360.io",
    quote:
      "See the activity feed, monitor feature usage, and check limits in one place.",
    href: activitiesTabRoute("usage"),
    cta: "View usage",
    src: slideImage("c360-activity-usage"),
  },
  {
    id: "ai-chat",
    name: "AI chat",
    designation: "contact360.io",
    quote:
      "Ask questions, summarize context, and draft outreach with your org data in scope.",
    href: ROUTES.AI_CHAT,
    cta: "Open AI chat",
    src: slideImage("c360-ai-chat"),
  },
  {
    id: "live-voice",
    name: "Live voice",
    designation: "contact360.io",
    quote:
      "Open AI Chat and use the mic in the composer for real-time voice when your plan includes it.",
    href: ROUTES.AI_CHAT,
    cta: "Open AI chat",
    src: slideImage("c360-live-voice"),
  },
  {
    id: "resume",
    name: "Resume & profiles",
    designation: "contact360.io",
    quote:
      "Build and work with resume-centric flows for candidates and roles.",
    href: ROUTES.RESUME,
    cta: "Resume",
    src: slideImage("c360-resume"),
  },
];

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

/**
 * Unsplash images matched to each slide theme (people/CRM, buildings, email, phone, etc.).
 * `ixlib` + crop params match Unsplash’s CDN contract and avoid broken legacy URLs.
 * Hostname allowlisted in next.config `images.remotePatterns`.
 */
function unsplashPhoto(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
}

/** One image per slide id — thematic pairing with the headline. */
const SLIDE_IMAGE: Record<CircularTestimonial["id"], string> = {
  // Team collaboration / relationship CRM
  "crm-contacts": unsplashPhoto("1522071820081-009f0129c71c"),
  // Corporate skyline / org scale
  companies: unsplashPhoto("1486406146926-c627a92ad1ab"),
  // Email & messaging / inbox workflow
  "email-tools": unsplashPhoto("1563986768609-322da13575f3"),
  // Mobile device / calls
  phone: unsplashPhoto("1511707171634-5f897ff02aa9"),
  // Strategy / campaign planning workspace
  campaigns: unsplashPhoto("1552664730-d307ca884978"),
  // Hiring & interviews / talent pipeline
  "hiring-signals": unsplashPhoto("1521737711867-e3b97375f902"),
  // Paperwork / documents / organized files
  files: unsplashPhoto("1454165804606-c3d57bc86b40"),
  // Professional handshake / B2B networking
  linkedin: unsplashPhoto("1521737604893-d14cc237f11d"),
  // Analytics dashboard / metrics wall
  "activity-usage": unsplashPhoto("1551288049-bebda4e38f71"),
  // AI / automation / neural imagery
  "ai-chat": unsplashPhoto("1677442136019-21780ecad995"),
  // Microphone / recording (replaces retired photo id that returned 404)
  "live-voice": unsplashPhoto("1478737270239-2f02b77fc618"),
  // Desk / documents / career (replaces retired photo id that returned 404)
  resume: unsplashPhoto("1544716278-ca5e3f4abd8c"),
};

export const DASHBOARD_DEMO_TESTIMONIALS: CircularTestimonial[] = [
  {
    id: "crm-contacts",
    name: "Contacts & VQL",
    designation: "contact360.io",
    quote:
      "Filter with advanced VQL, manage columns, and use saved list views for repeat work.",
    href: ROUTES.CONTACTS,
    cta: "Open contacts",
    src: SLIDE_IMAGE["crm-contacts"],
  },
  {
    id: "companies",
    name: "Company database",
    designation: "contact360.io",
    quote:
      "Search companies, use facets, and keep org records aligned with your contact lists.",
    href: ROUTES.COMPANIES,
    cta: "Open companies",
    src: SLIDE_IMAGE.companies,
  },
  {
    id: "email-tools",
    name: "Email finder & verify",
    designation: "contact360.io",
    quote:
      "Find addresses, run bulk jobs, and verify deliverability before you send.",
    href: ROUTES.EMAIL,
    cta: "Email tools",
    src: SLIDE_IMAGE["email-tools"],
  },
  {
    id: "phone",
    name: "Phone intelligence",
    designation: "contact360.io",
    quote:
      "Find and validate phone numbers alongside your contact and company data.",
    href: ROUTES.PHONE,
    cta: "Phone tools",
    src: SLIDE_IMAGE.phone,
  },
  {
    id: "campaigns",
    name: "Campaigns & sequences",
    designation: "contact360.io",
    quote: "Build campaigns, templates, and multi-step sequences from one hub.",
    href: ROUTES.CAMPAIGNS,
    cta: "Campaigns",
    src: SLIDE_IMAGE.campaigns,
  },
  {
    id: "hiring-signals",
    name: "Hiring Signals",
    designation: "contact360.io",
    quote:
      "Track job and hiring signals to prioritize outreach to the right orgs.",
    href: ROUTES.HIRING_SIGNALS,
    cta: "Hiring Signals",
    src: SLIDE_IMAGE["hiring-signals"],
  },
  {
    id: "files",
    name: "Storage",
    designation: "contact360.io",
    quote:
      "Upload files, run batch flows, and keep assets tied to your workspace.",
    href: FILES_DRAWER_NAV_HREF,
    cta: "Open storage",
    src: SLIDE_IMAGE.files,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    designation: "contact360.io",
    quote:
      "Export and work with LinkedIn data alongside your CRM in Contact360.",
    href: ROUTES.LINKEDIN,
    cta: "LinkedIn",
    src: SLIDE_IMAGE.linkedin,
  },
  {
    id: "activity-usage",
    name: "Activity & usage",
    designation: "contact360.io",
    quote:
      "See the activity feed, monitor feature usage, and check limits in one place.",
    href: activitiesTabRoute("usage"),
    cta: "View usage",
    src: SLIDE_IMAGE["activity-usage"],
  },
  {
    id: "ai-chat",
    name: "AI chat",
    designation: "contact360.io",
    quote:
      "Ask questions, summarize context, and draft outreach with your org data in scope.",
    href: ROUTES.AI_CHAT,
    cta: "Open AI chat",
    src: SLIDE_IMAGE["ai-chat"],
  },
  {
    id: "live-voice",
    name: "Live voice",
    designation: "contact360.io",
    quote:
      "Open AI Chat and use the mic in the composer for real-time voice when your plan includes it.",
    href: ROUTES.AI_CHAT,
    cta: "Open AI chat",
    src: SLIDE_IMAGE["live-voice"],
  },
  {
    id: "resume",
    name: "Resume & profiles",
    designation: "contact360.io",
    quote: "Build and work with resume-centric flows for candidates and roles.",
    href: ROUTES.RESUME,
    cta: "Resume",
    src: SLIDE_IMAGE.resume,
  },
];

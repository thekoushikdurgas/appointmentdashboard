"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Building2,
  Mail,
  Phone,
  Megaphone,
  Zap,
  FolderOpen,
  Star,
  Activity,
  Brain,
  Mic,
  FileText,
} from "lucide-react";
import { Carousel, type CarouselSlide } from "@/components/ui/Carousel";
import { ROUTES, activitiesTabRoute } from "@/lib/routes";
import {
  FILES_DRAWER_NAV_HREF,
  useFilesDrawer,
} from "@/context/FilesDrawerContext";

const GRADIENTS = [
  "c360-ad-slide--gradient-brand",
  "c360-ad-slide--gradient-midnight",
  "c360-ad-slide--gradient-ocean",
  "c360-ad-slide--gradient-purple",
] as const;

const CTA_CLASSES = [
  "c360-ad-slide__cta--on-brand",
  "c360-ad-slide__cta--linkedin",
  "c360-ad-slide__cta--on-success",
  "c360-ad-slide__cta--on-purple",
] as const;

type AdSlideSpec = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
};

/** Ordered by product priority; 12 slides — visual variants cycle every 4 (index % 4). */
const AD_SLIDE_SPECS: AdSlideSpec[] = [
  {
    id: "crm-contacts",
    title: "Contacts & VQL",
    description:
      "Filter with advanced VQL, manage columns, and use saved list views for repeat work.",
    href: ROUTES.CONTACTS,
    cta: "Open contacts",
    icon: Users,
  },
  {
    id: "companies",
    title: "Company database",
    description:
      "Search companies, use facets, and keep org records aligned with your contact lists.",
    href: ROUTES.COMPANIES,
    cta: "Open companies",
    icon: Building2,
  },
  {
    id: "email-tools",
    title: "Email finder & verify",
    description:
      "Find addresses, run bulk jobs, and verify deliverability before you send.",
    href: ROUTES.EMAIL,
    cta: "Email tools",
    icon: Mail,
  },
  {
    id: "phone",
    title: "Phone intelligence",
    description:
      "Find and validate phone numbers alongside your contact and company data.",
    href: ROUTES.PHONE,
    cta: "Phone tools",
    icon: Phone,
  },
  {
    id: "campaigns",
    title: "Campaigns & sequences",
    description:
      "Build campaigns, templates, and multi-step sequences from one hub.",
    href: ROUTES.CAMPAIGNS,
    cta: "Campaigns",
    icon: Megaphone,
  },
  {
    id: "hiring-signals",
    title: "Hiring signals",
    description:
      "Track job and hiring signals to prioritize outreach to the right orgs.",
    href: ROUTES.HIRING_SIGNALS,
    cta: "Hiring signals",
    icon: Zap,
  },
  {
    id: "files",
    title: "Files & storage",
    description:
      "Upload files, run batch flows, and keep assets tied to your workspace.",
    href: FILES_DRAWER_NAV_HREF,
    cta: "Open files",
    icon: FolderOpen,
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    description:
      "Export and work with LinkedIn data alongside your CRM in Contact360.",
    href: ROUTES.LINKEDIN,
    cta: "LinkedIn",
    icon: Star,
  },
  {
    id: "activity-usage",
    title: "Activity & usage",
    description:
      "See the activity feed, monitor feature usage, and check limits in one place.",
    href: activitiesTabRoute("usage"),
    cta: "View usage",
    icon: Activity,
  },
  {
    id: "ai-chat",
    title: "AI chat",
    description:
      "Ask questions, summarize context, and draft outreach with your org data in scope.",
    href: ROUTES.AI_CHAT,
    cta: "Open AI chat",
    icon: Brain,
  },
  {
    id: "live-voice",
    title: "Live voice",
    description:
      "Use real-time voice AI when your plan includes advanced collaboration.",
    href: ROUTES.LIVE_VOICE,
    cta: "Live voice",
    icon: Mic,
  },
  {
    id: "resume",
    title: "Resume & profiles",
    description:
      "Build and work with resume-centric flows for candidates and roles.",
    href: ROUTES.RESUME,
    cta: "Resume",
    icon: FileText,
  },
];

const ICON_COLOR = "#fff";

function AdSlideView({ spec, index }: { spec: AdSlideSpec; index: number }) {
  const grad = GRADIENTS[index % GRADIENTS.length];
  const cta = CTA_CLASSES[index % CTA_CLASSES.length];
  const Icon = spec.icon;
  const { openFilesDrawer } = useFilesDrawer();
  return (
    <div className={`c360-ad-slide ${grad}`}>
      <div className="c360-ad-slide__header">
        <Icon size={32} color={ICON_COLOR} aria-hidden />
        <h2 className="c360-ad-slide__title">{spec.title}</h2>
      </div>
      <p className="c360-ad-slide__desc">{spec.description}</p>
      {spec.href === FILES_DRAWER_NAV_HREF ? (
        <button
          type="button"
          className={`c360-ad-slide__cta ${cta}`}
          onClick={() => openFilesDrawer()}
        >
          {spec.cta}
        </button>
      ) : (
        <Link href={spec.href} className={`c360-ad-slide__cta ${cta}`}>
          {spec.cta}
        </Link>
      )}
    </div>
  );
}

const AD_SLIDES: CarouselSlide[] = AD_SLIDE_SPECS.map((spec, index) => ({
  id: spec.id,
  content: <AdSlideView spec={spec} index={index} />,
}));

interface DashboardAdCarouselProps {
  interval?: number;
}

const DEFAULT_INTERVAL_MS = 6000;

export function DashboardAdCarousel({
  interval = DEFAULT_INTERVAL_MS,
}: DashboardAdCarouselProps) {
  return (
    <Carousel slides={AD_SLIDES} className="c360-mb-6" interval={interval} />
  );
}

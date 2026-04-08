"use client";

import { Zap, Star, Shield, Globe } from "lucide-react";
import { Carousel } from "@/components/ui/Carousel";

const AD_SLIDES = [
  {
    id: "slide1",
    content: (
      <div className="c360-ad-slide c360-ad-slide--gradient-brand">
        <div className="c360-ad-slide__header">
          <Zap size={32} color="#fff" />
          <h2 className="c360-ad-slide__title">Bulk Email Finder</h2>
        </div>
        <p className="c360-ad-slide__desc">
          Process thousands of emails at once. Upload a CSV and let Contact360
          do the work.
        </p>
        <a
          href="/email"
          className="c360-ad-slide__cta c360-ad-slide__cta--on-brand"
        >
          Try Bulk Finder
        </a>
      </div>
    ),
  },
  {
    id: "slide2",
    content: (
      <div className="c360-ad-slide c360-ad-slide--gradient-midnight">
        <div className="c360-ad-slide__header">
          <Star size={32} color="#ffd700" />
          <h2 className="c360-ad-slide__title">LinkedIn Enrichment</h2>
        </div>
        <p className="c360-ad-slide__desc">
          Enrich your contacts automatically with LinkedIn profile data, job
          titles, and company info.
        </p>
        <a
          href="/linkedin"
          className="c360-ad-slide__cta c360-ad-slide__cta--linkedin"
        >
          Explore LinkedIn
        </a>
      </div>
    ),
  },
  {
    id: "slide3",
    content: (
      <div className="c360-ad-slide c360-ad-slide--gradient-ocean">
        <div className="c360-ad-slide__header">
          <Shield size={32} color="var(--c360-success)" />
          <h2 className="c360-ad-slide__title">Email Verification</h2>
        </div>
        <p className="c360-ad-slide__desc">
          Maintain a clean list. Verify email deliverability and remove bounces
          before you send.
        </p>
        <a
          href="/email"
          className="c360-ad-slide__cta c360-ad-slide__cta--on-success"
        >
          Verify Emails
        </a>
      </div>
    ),
  },
  {
    id: "slide4",
    content: (
      <div className="c360-ad-slide c360-ad-slide--gradient-purple">
        <div className="c360-ad-slide__header">
          <Globe size={32} color="#fff" />
          <h2 className="c360-ad-slide__title">AI Chat Assistant</h2>
        </div>
        <p className="c360-ad-slide__desc">
          Ask your data anything. Summarize contacts, generate outreach copy,
          get insights instantly.
        </p>
        <a
          href="/ai-chat"
          className="c360-ad-slide__cta c360-ad-slide__cta--on-purple"
        >
          Open AI Chat
        </a>
      </div>
    ),
  },
];

interface DashboardAdCarouselProps {
  interval?: number;
}

export function DashboardAdCarousel({
  interval = 5000,
}: DashboardAdCarouselProps) {
  return (
    <Carousel slides={AD_SLIDES} className="c360-mb-6" interval={interval} />
  );
}

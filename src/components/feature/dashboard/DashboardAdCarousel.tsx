"use client";

import { CircularTestimonials } from "@/components/ui/circular-testimonials/CircularTestimonials";
import { DASHBOARD_DEMO_TESTIMONIALS } from "@/components/ui/circular-testimonials/dashboardDemoTestimonials";

interface DashboardAdCarouselProps {
  /** Passed through as autoplay interval when autoplay is enabled. */
  interval?: number;
}

const DEFAULT_INTERVAL_MS = 6000;

export function DashboardAdCarousel({
  interval = DEFAULT_INTERVAL_MS,
}: DashboardAdCarouselProps) {
  return (
    <CircularTestimonials
      testimonials={DASHBOARD_DEMO_TESTIMONIALS}
      autoplay
      autoplayMs={interval}
      variant="dashboard"
    />
  );
}

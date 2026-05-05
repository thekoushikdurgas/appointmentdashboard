"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import { format } from "date-fns";
import { Accordion } from "@/components/ui/Accordion";
import type { AccordionItem } from "@/components/ui/Accordion";
import { activityIconAccent, activityServiceIcon } from "@/lib/activityDisplay";
import { formatRelativeTime } from "@/lib/utils";

export interface ActivityItem {
  id: string | number;
  text: string;
  time: string;
  type: "success" | "info";
}

interface DashboardActivityFeedProps {
  items: ActivityItem[];
}

function firstSegment(text: string): string {
  const raw = text.split("·")[0]?.trim();
  return raw && raw.length > 0 ? raw : "activity";
}

function splitActivityText(text: string): {
  headline: string;
  subtitle: string;
} {
  const parts = text
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0)
    return { headline: text || "Activity", subtitle: "Event" };
  const raw = parts[0] ?? "";
  const headline =
    raw.length > 0 ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Activity";
  const subtitle =
    parts.length > 1 ? parts.slice(1).join(" · ") : "Latest event";
  return { headline, subtitle };
}

function formatAbsolute(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return format(d, "PPp");
  } catch {
    return iso;
  }
}

function toAccordionItems(items: ActivityItem[]): AccordionItem[] {
  return items.map((item) => {
    const { headline, subtitle } = splitActivityText(item.text);
    const serviceKey = firstSegment(item.text);
    const Icon = activityServiceIcon(serviceKey);
    const iconFg = activityIconAccent(serviceKey);
    const iconWrapStyle: CSSProperties = {
      color: iconFg,
      backgroundColor: `color-mix(in srgb, ${iconFg} 16%, transparent)`,
    };

    return {
      id: String(item.id),
      title: (
        <span className="c360-dashboard-activity-accordion__trigger-row">
          <span
            className="c360-dashboard-activity-accordion__icon-wrap"
            style={iconWrapStyle}
            aria-hidden
          >
            <Icon size={20} strokeWidth={2} />
          </span>
          <span className="c360-dashboard-activity-accordion__text-stack">
            <span className="c360-dashboard-activity-accordion__headline">
              {headline}
            </span>
            <span className="c360-dashboard-activity-accordion__sub">
              {subtitle}
            </span>
          </span>
          <span className="c360-dashboard-activity-accordion__when">
            {formatRelativeTime(item.time)}
          </span>
        </span>
      ),
      content: (
        <div className="c360-dashboard-activity-accordion__detail">
          <p className="c360-dashboard-activity-accordion__detail-line">
            {item.text}
          </p>
          <p className="c360-dashboard-activity-accordion__detail-meta">
            {formatAbsolute(item.time)}
          </p>
        </div>
      ),
    };
  });
}

export function DashboardActivityFeed({ items }: DashboardActivityFeedProps) {
  const accordionItems = useMemo(() => toAccordionItems(items), [items]);

  const defaultOpen = useMemo(
    () => (items.length > 0 ? [String(items[0]!.id)] : []),
    [items],
  );

  if (items.length === 0) {
    return (
      <p className="c360-dashboard-activity-feed__empty">No recent activity.</p>
    );
  }

  return (
    <div className="c360-dashboard-activity-accordion-wrap">
      <Accordion
        variant="bordered"
        className="c360-dashboard-activity-accordion"
        items={accordionItems}
        allowMultiple={false}
        defaultOpen={defaultOpen}
      />
    </div>
  );
}

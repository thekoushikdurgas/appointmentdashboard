"use client";

import Link from "next/link";
import { BarChart3, CreditCard, Activity, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ROUTES } from "@/lib/routes";

const LINKS: Array<{
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    href: ROUTES.USAGE,
    label: "Usage",
    description: "Feature-level usage counters and resets.",
    icon: <BarChart3 size={18} />,
  },
  {
    href: ROUTES.BILLING,
    label: "Billing",
    description: "Plans, credits, and subscription.",
    icon: <CreditCard size={18} />,
  },
  {
    href: ROUTES.ACTIVITIES,
    label: "Activities",
    description: "Recent actions across the workspace.",
    icon: <Activity size={18} />,
  },
  {
    href: ROUTES.JOBS,
    label: "Jobs",
    description: "Background jobs and exports.",
    icon: <Briefcase size={18} />,
  },
];

export function AnalyticsUsageTab() {
  return (
    <div className="c360-flex c360-flex-col c360-gap-4">
      <Alert variant="info">
        Product usage (emails found, credits, campaigns) is not stored in
        performance metrics. Use the links below for usage and billing; this tab
        keeps analytics focused on Core Web Vitals and RUM.
      </Alert>
      <div className="c360-widget-grid c360-widget-grid--dense">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="c360-analytics-usage-link"
          >
            <Card title={item.label}>
              <div className="c360-flex c360-gap-3 c360-items-start">
                <span className="c360-analytics-usage-link__icon">
                  {item.icon}
                </span>
                <p className="c360-m-0 c360-text-sm c360-text-muted">
                  {item.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

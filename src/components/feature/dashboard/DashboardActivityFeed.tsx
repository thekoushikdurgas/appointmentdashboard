"use client";

import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function DashboardActivityFeed({ items }: DashboardActivityFeedProps) {
  if (items.length === 0) {
    return <p className="c360-page-subtitle">No recent activity.</p>;
  }
  return (
    <div className="c360-section-stack">
      {items.map((item) => (
        <div key={item.id} className="c360-stat-tile c360-flex c360-gap-3">
          <div
            className={cn(
              "c360-activity-icon",
              item.type === "success"
                ? "c360-dashboard-feed-icon--success"
                : "c360-dashboard-feed-icon--info",
            )}
          >
            <Activity size={14} />
          </div>
          <div className="c360-activity-body">
            <p className="c360-activity-text">{item.text}</p>
            <p className="c360-activity-time">
              {formatRelativeTime(item.time)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

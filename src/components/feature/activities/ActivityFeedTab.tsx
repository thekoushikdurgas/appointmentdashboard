"use client";

import { Card } from "@/components/ui/Card";
import { applyVars } from "@/hooks/useCSSVars";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";
import {
  activityIconAccent,
  activityServiceIcon,
  activityStatusColor,
  humanizeToken,
} from "@/lib/activityDisplay";

export interface FeedActivityItem {
  id: string;
  serviceType: string;
  actionType: string;
  status: string;
  description: string;
  createdAt: string;
  resultCount?: number;
  errorMessage?: string | null;
}

interface ActivityFeedTabProps {
  activities: FeedActivityItem[];
  loading?: boolean;
}

export function ActivityFeedTab({ activities, loading }: ActivityFeedTabProps) {
  return (
    <Card
      className="c360-card--activity-feed-tab"
      title="Activity Feed"
      subtitle="Account events matching your filters"
    >
      {loading ? (
        <p className="c360-page-subtitle">Loading activities…</p>
      ) : activities.length === 0 ? (
        <p className="c360-page-subtitle">
          No activities match these filters. Try widening the date range or
          clearing filters.
        </p>
      ) : (
        <div className="c360-section-stack c360-section-stack--sm">
          {activities.map((activity) => {
            const Icon = activityServiceIcon(activity.serviceType);
            const accent = activityIconAccent(activity.serviceType);
            const statusColor = activityStatusColor(activity.status);
            return (
              <div key={activity.id} className="c360-activity-feed-item">
                <div
                  className="c360-activity-icon c360-activity-icon--lg c360-activity-icon-tinted"
                  ref={(el) =>
                    applyVars(el, { "--c360-activity-accent": accent })
                  }
                >
                  <Icon size={16} aria-hidden />
                </div>
                <div className="c360-activity-body">
                  <p className="c360-activity-desc">{activity.description}</p>
                  <div className="c360-activity-meta">
                    <Badge color="gray" size="sm">
                      {humanizeToken(activity.serviceType)}
                    </Badge>
                    <Badge color="gray" size="sm">
                      {humanizeToken(activity.actionType)}
                    </Badge>
                    <span
                      className="c360-text-xs c360-font-semibold c360-activity-status-label"
                      ref={(el) =>
                        applyVars(el, {
                          "--c360-activity-status": statusColor,
                        })
                      }
                    >
                      {humanizeToken(activity.status)}
                    </span>
                    {activity.resultCount != null &&
                      activity.resultCount > 0 && (
                        <span className="c360-text-xs c360-text-muted">
                          {activity.resultCount} results
                        </span>
                      )}
                    <span className="c360-activity-time">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

"use client";

import Link from "next/link";
import { CheckCheck, Trash2 } from "lucide-react";
import { notificationDetailRoute } from "@/lib/routes";
import { Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  normalizeNotificationPriority,
  normalizeNotificationType,
  priorityToBadgeColor,
  typeToBadgeColor,
} from "@/lib/notificationDisplay";

export interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  read: boolean;
  createdAt: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  onMarkRead: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
}

export function NotificationCard({
  id,
  title,
  message,
  type,
  priority,
  read,
  createdAt,
  actionLabel,
  actionUrl,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const pLabel = String(normalizeNotificationPriority(priority));
  const tLabel = String(normalizeNotificationType(type));

  return (
    <div
      className={cn(
        "c360-notification-item",
        read
          ? "c360-notification-item--read"
          : "c360-notification-item--unread",
      )}
    >
      <div className="c360-notification-dot" />
      <div className="c360-notification-body">
        <div className="c360-notification-header">
          <Link
            href={notificationDetailRoute(id)}
            className="c360-notification-title-link"
          >
            {title}
          </Link>
          <Badge
            color={priorityToBadgeColor(priority)}
            className="c360-text-xs"
          >
            {pLabel}
          </Badge>
          <Badge color={typeToBadgeColor(type)} className="c360-text-xs">
            {tLabel}
          </Badge>
        </div>
        <p className="c360-notification-msg">{message}</p>
        <div className="c360-notification-footer">
          <span className="c360-notification-time">
            {formatRelativeTime(createdAt)}
          </span>
          {actionLabel && actionUrl && (
            <a href={actionUrl} className="c360-notification-action-link">
              {actionLabel}
            </a>
          )}
        </div>
      </div>
      <div className="c360-notification-actions">
        {!read && (
          <button
            type="button"
            title="Mark as read"
            onClick={() => onMarkRead([id])}
            className="c360-icon-btn"
          >
            <CheckCheck size={14} />
          </button>
        )}
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete([id])}
          className="c360-icon-btn"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { notificationsService } from "@/services/graphql/notificationsService";
import type { Notification } from "@/graphql/generated/types";
import { ROUTES } from "@/lib/routes";
import { formatRelativeTime } from "@/lib/utils";
import {
  normalizeNotificationPriority,
  normalizeNotificationType,
  priorityToBadgeColor,
  typeToBadgeColor,
} from "@/lib/notificationDisplay";

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? String(params.id) : "";
  const [row, setRow] = useState<Notification | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const n = await notificationsService.get(id);
        if (cancelled) return;
        setRow(n);
        if (!n.read) {
          const res = await notificationsService.markNotificationAsRead(id);
          if (!cancelled) setRow(res.notifications.markNotificationAsRead);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setRow(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (row === undefined) {
    return (
      <DashboardPageLayout>
        <p className="c360-text-muted">Loading…</p>
      </DashboardPageLayout>
    );
  }

  if (error || !row) {
    return (
      <DashboardPageLayout>
        <Card title="Notification">
          <p className="c360-text-muted c360-mb-4">
            {error ?? "This notification could not be loaded."}
          </p>
          <Link href={ROUTES.NOTIFICATIONS}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft size={14} />}
            >
              Back to notifications
            </Button>
          </Link>
        </Card>
      </DashboardPageLayout>
    );
  }

  const n = row;
  const meta =
    n.metadata != null
      ? typeof n.metadata === "string"
        ? n.metadata
        : JSON.stringify(n.metadata, null, 2)
      : null;

  return (
    <DashboardPageLayout>
      <div className="c360-page-header c360-mb-4">
        <div>
          <Link href={ROUTES.NOTIFICATIONS} className="c360-text-sm">
            ← All notifications
          </Link>
          <h1 className="c360-page-title c360-mt-2">{n.title}</h1>
          <p className="c360-page-subtitle">
            {formatRelativeTime(n.createdAt)} ·{" "}
            <Badge
              color={priorityToBadgeColor(n.priority)}
              className="c360-text-xs"
            >
              {String(normalizeNotificationPriority(n.priority))}
            </Badge>{" "}
            <Badge color={typeToBadgeColor(n.type)} className="c360-text-xs">
              {String(normalizeNotificationType(n.type))}
            </Badge>
          </p>
        </div>
      </div>

      <Card>
        <p className="c360-text-sm c360-m-0">{n.message}</p>
        {n.actionLabel && n.actionUrl && (
          <p className="c360-mt-4">
            <a href={n.actionUrl} className="c360-notification-action-link">
              {n.actionLabel}
            </a>
          </p>
        )}
        {meta && (
          <pre className="c360-text-xs c360-mt-4 c360-notif-detail__meta-pre">
            {meta}
          </pre>
        )}
      </Card>
    </DashboardPageLayout>
  );
}

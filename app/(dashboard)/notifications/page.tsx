"use client";

import { useState, useMemo } from "react";
import { Bell, RefreshCw, Trash2, CheckCheck, Settings2 } from "lucide-react";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/feature/notifications/NotificationCard";
import { NotificationPreferencesTab } from "@/components/feature/notifications/NotificationPreferencesTab";
import {
  NotificationTypeFilter,
  type NotificationTypeFilterValue,
} from "@/components/feature/notifications/NotificationTypeFilter";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [tab, setTab] = useState<"all" | "unread" | "preferences">("all");
  const [typeFilter, setTypeFilter] =
    useState<NotificationTypeFilterValue>("ALL");

  const listOpts = useMemo(
    () => ({
      pageSize: 25,
      type: typeFilter === "ALL" ? null : typeFilter,
    }),
    [typeFilter],
  );

  const {
    notifications,
    unreadCount,
    total,
    hasNext,
    loading,
    loadingMore,
    error,
    markRead,
    deleteSelected,
    deleteAllRead,
    refresh,
    loadMore,
  } = useNotifications(listOpts);

  const displayed =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <DashboardPageLayout>
      <div className="c360-page-header">
        <div>
          <h1 className="c360-page-header__title c360-flex c360-items-center c360-flex-wrap c360-gap-2">
            <Bell size={22} className="c360-flex-shrink-0" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge color="red" className="c360-text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="c360-page-header__subtitle">
            Showing {notifications.length.toLocaleString()} loaded ·{" "}
            {total.toLocaleString()} total
            {hasNext ? " · more available" : ""}
          </p>
        </div>
        <div className="c360-badge-row">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Trash2 size={14} />}
            onClick={() => void deleteAllRead()}
            disabled={loading}
          >
            Clear read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<CheckCheck size={14} />}
            onClick={() => {
              const unread = notifications
                .filter((n) => !n.read)
                .map((n) => n.id);
              if (unread.length) void markRead(unread);
            }}
            disabled={loading || unreadCount === 0}
          >
            Mark all read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <RefreshCw size={14} className={cn(loading && "c360-spin")} />
            }
            onClick={refresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="c360-mb-4">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="c360-ml-2"
            disabled={loading}
            leftIcon={
              <RefreshCw size={13} className={cn(loading && "c360-spin")} />
            }
            onClick={refresh}
          >
            Retry
          </Button>
        </Alert>
      )}

      <Card>
        <div className="c360-mb-4">
          <p className="c360-text-sm c360-text-muted c360-mb-2">
            Filter by type (maps to{" "}
            <code className="c360-text-xs">NotificationFilterInput.type</code>)
          </p>
          <NotificationTypeFilter
            value={typeFilter}
            onChange={setTypeFilter}
            disabled={loading}
          />
        </div>

        {loading && (
          <Progress
            indeterminate
            label="Loading notifications"
            className="c360-mb-4"
          />
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">
              All ({notifications.length}
              {total > notifications.length ? ` / ${total}` : ""})
            </TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings2 size={14} className="c360-mr-1" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {!loading && displayed.length === 0 ? (
              <div className="c360-empty-state">
                <Bell size={40} className="c360-empty-state__icon" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              <>
                {displayed.map((n) => (
                  <NotificationCard
                    key={n.id}
                    id={n.id}
                    title={n.title}
                    message={n.message}
                    type={n.type}
                    priority={n.priority}
                    read={n.read}
                    createdAt={n.createdAt}
                    actionLabel={n.actionLabel}
                    actionUrl={n.actionUrl}
                    onMarkRead={markRead}
                    onDelete={deleteSelected}
                  />
                ))}
                {hasNext && (
                  <div className="c360-flex c360-justify-center c360-mt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={loadingMore}
                      onClick={() => void loadMore()}
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="unread">
            {!loading && displayed.length === 0 ? (
              <div className="c360-empty-state">
                <CheckCheck size={40} className="c360-empty-state__icon" />
                <p>All caught up! No unread notifications.</p>
              </div>
            ) : (
              displayed.map((n) => (
                <NotificationCard
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  message={n.message}
                  type={n.type}
                  priority={n.priority}
                  read={n.read}
                  createdAt={n.createdAt}
                  actionLabel={n.actionLabel}
                  actionUrl={n.actionUrl}
                  onMarkRead={markRead}
                  onDelete={deleteSelected}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="preferences">
            <NotificationPreferencesTab />
          </TabsContent>
        </Tabs>
      </Card>
    </DashboardPageLayout>
  );
}

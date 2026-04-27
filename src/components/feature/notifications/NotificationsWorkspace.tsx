"use client";

import { useState, useMemo, useCallback } from "react";
import { Bell, RefreshCw, Trash2, CheckCheck, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationsDrawer } from "@/context/NotificationsDrawerContext";
import { NotificationCard } from "@/components/feature/notifications/NotificationCard";
import { NotificationPreferencesTab } from "@/components/feature/notifications/NotificationPreferencesTab";
import {
  NotificationTypeFilter,
  type NotificationTypeFilterValue,
} from "@/components/feature/notifications/NotificationTypeFilter";
import { cn } from "@/lib/utils";

/**
 * Full notifications list + preferences UI (formerly the `/notifications` page).
 * Mounted inside the global notifications drawer.
 */
export function NotificationsWorkspace() {
  const { refreshUnreadCount } = useNotificationsDrawer();
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
    markRead: markReadBase,
    deleteSelected: deleteSelectedBase,
    deleteAllRead: deleteAllReadBase,
    refresh: refreshBase,
    loadMore,
  } = useNotifications(listOpts);

  const markRead = useCallback(
    async (ids: string[]) => {
      await markReadBase(ids);
      await refreshUnreadCount();
    },
    [markReadBase, refreshUnreadCount],
  );

  const deleteSelected = useCallback(
    async (ids: string[]) => {
      await deleteSelectedBase(ids);
      await refreshUnreadCount();
    },
    [deleteSelectedBase, refreshUnreadCount],
  );

  const deleteAllRead = useCallback(async () => {
    await deleteAllReadBase();
    await refreshUnreadCount();
  }, [deleteAllReadBase, refreshUnreadCount]);

  const refresh = useCallback(() => {
    refreshBase();
    void refreshUnreadCount();
  }, [refreshBase, refreshUnreadCount]);

  const displayed =
    tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="c360-notifications-workspace">
      <div className="c360-notifications-workspace__toolbar c360-mb-4">
        <div className="c360-min-w-0">
          <div className="c360-flex c360-items-center c360-flex-wrap c360-gap-2">
            <Bell size={20} className="c360-flex-shrink-0" aria-hidden />
            <span className="c360-text-base c360-font-semibold c360-text-ink">
              Inbox
            </span>
            {unreadCount > 0 && (
              <Badge color="red" className="c360-text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="c360-text-2xs c360-text-muted c360-mt-1 c360-m-0">
            Showing {notifications.length.toLocaleString()} loaded ·{" "}
            {total.toLocaleString()} total
            {hasNext ? " · more available" : ""}
          </p>
        </div>
        <div className="c360-badge-row c360-flex-wrap">
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
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  notificationsService,
  type NotificationsListResult,
} from "@/services/graphql/notificationsService";
import type {
  Notification,
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
  GraphQlNotificationType,
} from "@/graphql/generated/types";
import {
  readTTLCache,
  writeTTLCache,
  clearTTLCache,
} from "@/lib/ttlLocalStorageCache";

const NOTIF_PREFS_CACHE_KEY = "c360:notif:prefs:v1";
const NOTIF_PREFS_TTL_MS = 10 * 60 * 1000;

const POLL_INTERVAL_MS = 30_000;

function buildFilters(
  pageSize: number,
  offset: number,
  opts?: {
    unreadOnly?: boolean;
    type?: GraphQlNotificationType | null;
  },
) {
  return {
    limit: pageSize,
    offset,
    unreadOnly: opts?.unreadOnly ?? false,
    ...(opts?.type ? { type: opts.type } : {}),
  };
}

export function useNotifications(opts?: {
  /** Items per request (default 25). */
  pageSize?: number;
  unreadOnly?: boolean;
  /** When set (not ALL), passed as `NotificationFilterInput.type`. */
  type?: GraphQlNotificationType | null;
}) {
  const pageSize = opts?.pageSize ?? 25;
  const unreadOnly = opts?.unreadOnly ?? false;
  const filterType = opts?.type ?? null;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const filters = buildFilters(pageSize, offset, {
        unreadOnly,
        type: filterType,
      });
      const conn: NotificationsListResult =
        await notificationsService.list(filters);
      if (append) {
        setNotifications((prev) => [...prev, ...conn.items]);
      } else {
        setNotifications(conn.items);
      }
      setNextOffset(offset + conn.items.length);
      setHasNext(conn.pageInfo.hasNext);
      setTotal(conn.pageInfo.total);
    },
    [pageSize, unreadOnly, filterType],
  );

  const fetchFirstPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchPage(0, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!hasNext || loading || loadingMore) return;
    try {
      setLoadingMore(true);
      setError(null);
      await fetchPage(nextOffset, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasNext, loading, loadingMore, nextOffset]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsService.unreadCount();
      setUnreadCount(res.notifications.unreadCount.count);
    } catch {
      /* keep previous count */
    }
  }, []);

  useEffect(() => {
    // Fetch first page + unread count concurrently instead of sequentially
    void Promise.all([fetchFirstPage(), fetchUnreadCount()]);
    intervalRef.current = setInterval(
      () => void fetchUnreadCount(),
      POLL_INTERVAL_MS,
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchFirstPage, fetchUnreadCount]);

  const markRead = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await notificationsService.markNotificationsAsRead(ids);
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)),
      );
      await fetchUnreadCount();
    },
    [fetchUnreadCount],
  );

  const deleteSelected = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      await notificationsService.deleteNotifications(ids);
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setTotal((t) => Math.max(0, t - ids.length));
      await fetchUnreadCount();
    },
    [fetchUnreadCount],
  );

  const deleteAllRead = useCallback(async () => {
    const { count } = await notificationsService.deleteAllRead();
    setNotifications((prev) => prev.filter((n) => !n.read));
    setTotal((t) => Math.max(0, t - count));
    await fetchUnreadCount();
    await fetchFirstPage();
  }, [fetchFirstPage, fetchUnreadCount]);

  const refresh = useCallback(() => {
    void fetchFirstPage();
    void fetchUnreadCount();
  }, [fetchFirstPage, fetchUnreadCount]);

  return {
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
  };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(
      () => readTTLCache<NotificationPreferences>(NOTIF_PREFS_CACHE_KEY),
    );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readTTLCache<NotificationPreferences>(NOTIF_PREFS_CACHE_KEY);
    if (cached) {
      setPreferences(cached);
      return;
    }
    setLoading(true);
    notificationsService
      .getPreferences()
      .then((res) => {
        const prefs = res.notifications.notificationPreferences;
        setPreferences(prefs);
        writeTTLCache(NOTIF_PREFS_CACHE_KEY, prefs, NOTIF_PREFS_TTL_MS);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const update = useCallback(
    async (patch: UpdateNotificationPreferencesInput) => {
      setSaving(true);
      setError(null);
      try {
        const res = await notificationsService.updatePreferences(patch);
        const updated = res.notifications.updateNotificationPreferences;
        setPreferences(updated);
        clearTTLCache(NOTIF_PREFS_CACHE_KEY);
        writeTTLCache(NOTIF_PREFS_CACHE_KEY, updated, NOTIF_PREFS_TTL_MS);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { preferences, loading, saving, error, update };
}

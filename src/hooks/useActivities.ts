"use client";
import { useState, useEffect, useCallback } from "react";
import {
  activitiesService,
  type Activity,
  type ActivityStats,
} from "@/services/graphql/activitiesService";

export interface UseActivitiesFilter {
  serviceType?: string;
  actionType?: string;
  status?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

function errMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  return String(reason);
}

export function useActivities(filter?: UseActivitiesFilter) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [connectionLimit, setConnectionLimit] = useState(50);
  const [connectionOffset, setConnectionOffset] = useState(0);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { serviceType, actionType, status, limit, offset, startDate, endDate } =
    filter ?? {};

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterArg = {
        serviceType: serviceType || undefined,
        actionType: actionType || undefined,
        status: status || undefined,
        limit,
        offset,
        startDate,
        endDate,
      };
      const [listRes, statsRes] = await Promise.allSettled([
        activitiesService.list(filterArg),
        activitiesService.getStats({ startDate, endDate }),
      ]);

      if (listRes.status === "fulfilled") {
        const conn = listRes.value.activities.activities;
        setActivities(conn.items);
        setTotal(conn.total);
        setHasNext(conn.hasNext);
        setHasPrevious(conn.hasPrevious);
        setConnectionLimit(conn.limit);
        setConnectionOffset(conn.offset);
      } else {
        setActivities([]);
        setTotal(0);
        setHasNext(false);
        setHasPrevious(false);
      }

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.activities.activityStats);
      } else {
        setStats(null);
      }

      setError(
        listRes.status === "rejected" ? errMessage(listRes.reason) : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [serviceType, actionType, status, limit, offset, startDate, endDate]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return {
    activities,
    total,
    hasNext,
    hasPrevious,
    limit: connectionLimit,
    offset: connectionOffset,
    stats,
    loading,
    error,
    refresh: fetchAll,
  };
}

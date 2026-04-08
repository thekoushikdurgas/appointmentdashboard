"use client";
import { useState, useEffect, useCallback } from "react";
import {
  adminService,
  AdminUserRow,
  AdminStats,
  LogEntry,
  UserHistoryItem,
} from "@/services/graphql/adminService";

export function useAdmin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const s = await adminService.getStats();
      setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const fetchUsers = useCallback(
    async (page = 1, limit = 20, _search?: string, useBuckets = false) => {
      setLoading(true);
      try {
        const res = await adminService.listUsers(page, limit, {
          useBuckets,
        });
        setUsers(res.users);
        setTotalUsers(res.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchLogs = useCallback(
    async (filters?: {
      level?: string;
      logger?: string;
      userId?: string;
      requestId?: string;
      limit?: number;
      offset?: number;
      startTime?: string;
      endTime?: string;
    }) => {
      setLoading(true);
      try {
        const res = await adminService.getLogs({
          level: filters?.level,
          logger: filters?.logger,
          userId: filters?.userId,
          requestId: filters?.requestId,
          limit: filters?.limit,
          offset: filters?.offset,
          startTime: filters?.startTime,
          endTime: filters?.endTime,
        });
        setLogs(res.items);
        setTotalLogs(res.pageInfo.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchStats();
    void fetchUsers();
    void fetchLogs();
  }, [fetchStats, fetchUsers, fetchLogs]);

  const getUserHistory = useCallback(
    async (
      userId: string,
      limit = 50,
      offset = 0,
    ): Promise<UserHistoryItem[]> => {
      const res = await adminService.getUserHistory({
        userId,
        limit,
        offset,
      });
      return res.items;
    },
    [],
  );

  const updateUserCredits = useCallback(
    async (userId: string, credits: number) => {
      const res = await adminService.updateUserCredits({
        userId,
        credits,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, credits } : u)),
      );
      return res;
    },
    [],
  );

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    await adminService.updateUserRole(userId, role);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }, []);

  const searchLogs = useCallback(async (query: string) => {
    const res = await adminService.searchLogs(query);
    setLogs(res.items);
    setTotalLogs(res.pageInfo.total);
  }, []);

  return {
    stats,
    users,
    totalUsers,
    logs,
    totalLogs,
    loading,
    error,
    fetchUsers,
    fetchLogs,
    getUserHistory,
    updateUserCredits,
    updateUserRole,
    searchLogs,
  };
}

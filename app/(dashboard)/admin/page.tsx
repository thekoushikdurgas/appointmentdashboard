"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, FileText, CreditCard, BarChart2, History } from "lucide-react";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { ROLES } from "@/lib/constants";
import {
  adminService,
  type AdminStats,
  type AdminUser,
  type LogEntry,
} from "@/services/graphql/adminService";
import type { LogStatistics, UserHistoryItem } from "@/graphql/generated/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { AdminStatGrid } from "@/components/feature/admin/AdminStatGrid";
import { AdminUserTable } from "@/components/feature/admin/AdminUserTable";
import { AdminLogTable } from "@/components/feature/admin/AdminLogTable";
import { AdminCreditsForm } from "@/components/feature/admin/AdminCreditsForm";
import {
  AdminObservabilityTab,
  type LogTimeRange,
} from "@/components/feature/admin/AdminObservabilityTab";
import { AdminHistoryTab } from "@/components/feature/admin/AdminHistoryTab";
import { toast } from "sonner";

const USER_PAGE_SIZE = 10;
const LOG_PAGE_SIZE = 25;
const HISTORY_PAGE_SIZE = 20;

function localDateTimeToIso(local: string): string | undefined {
  const t = local.trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

type ConfirmAction =
  | { kind: "delete"; user: AdminUser }
  | { kind: "promoteAdmin"; user: AdminUser }
  | { kind: "promoteSuper"; user: AdminUser }
  | null;

export default function AdminPage() {
  const { loading: authLoading, isSuperAdmin } = useSessionGuard({
    allowedRoles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  });

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [headerLogStats, setHeaderLogStats] = useState<LogStatistics | null>(
    null,
  );
  const [headerLogStatsLoading, setHeaderLogStatsLoading] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("users");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logSearch, setLogSearch] = useState("");
  const [logLevel, setLogLevel] = useState("");
  const [logLogger, setLogLogger] = useState("");
  const [logUserId, setLogUserId] = useState("");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");

  const [obsStats, setObsStats] = useState<LogStatistics | null>(null);
  const [obsLoading, setObsLoading] = useState(false);
  const [obsRange, setObsRange] = useState<LogTimeRange>("24h");

  const [historyItems, setHistoryItems] = useState<UserHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyUserId, setHistoryUserId] = useState("");
  const [historyEventType, setHistoryEventType] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  const [creditUserId, setCreditUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState("");
  const [updatingCredits, setUpdatingCredits] = useState(false);

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [updatingRole, setUpdatingRole] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const loadUsersAndStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u] = await Promise.all([
        adminService.getStats(),
        adminService.listUsers(page, USER_PAGE_SIZE, {
          useBuckets: !isSuperAdmin,
        }),
      ]);
      setStats(s);
      const q = search.trim().toLowerCase();
      const filtered = q
        ? u.users.filter(
            (x) =>
              x.email.toLowerCase().includes(q) ||
              x.fullName.toLowerCase().includes(q),
          )
        : u.users;
      setUsers(filtered);
      setTotal(q ? filtered.length : u.total);
    } catch (e) {
      setStats(null);
      setUsers([]);
      setTotal(0);
      setError(
        e instanceof Error
          ? e.message
          : "Admin endpoints require Admin/SuperAdmin and may be unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, isSuperAdmin]);

  useEffect(() => {
    if (authLoading) return;
    void loadUsersAndStats();
  }, [authLoading, loadUsersAndStats]);

  useEffect(() => {
    if (authLoading || !isSuperAdmin) {
      setHeaderLogStats(null);
      return;
    }
    let cancelled = false;
    setHeaderLogStatsLoading(true);
    (async () => {
      try {
        const ls = await adminService.getLogStatistics("24h");
        if (!cancelled) setHeaderLogStats(ls);
      } catch {
        if (!cancelled) setHeaderLogStats(null);
      } finally {
        if (!cancelled) setHeaderLogStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isSuperAdmin]);

  const loadLogs = useCallback(
    async (pageOverride?: number) => {
      if (!isSuperAdmin) return;
      setLogsLoading(true);
      try {
        const p = pageOverride ?? logPage;
        const offset = (p - 1) * LOG_PAGE_SIZE;
        const startIso = localDateTimeToIso(logStart);
        const endIso = localDateTimeToIso(logEnd);
        if (logSearch.trim()) {
          const res = await adminService.searchLogs(
            logSearch.trim(),
            LOG_PAGE_SIZE,
            offset,
          );
          setLogs(res.items);
          setLogTotal(res.pageInfo.total);
        } else {
          const res = await adminService.getLogs({
            level: logLevel || undefined,
            logger: logLogger || undefined,
            userId: logUserId || undefined,
            startTime: startIso,
            endTime: endIso,
            limit: LOG_PAGE_SIZE,
            offset,
          });
          setLogs(res.items);
          setLogTotal(res.pageInfo.total);
        }
      } catch {
        setLogs([]);
        setLogTotal(0);
      } finally {
        setLogsLoading(false);
      }
    },
    [
      isSuperAdmin,
      logPage,
      logSearch,
      logLevel,
      logLogger,
      logUserId,
      logStart,
      logEnd,
    ],
  );

  useEffect(() => {
    if (authLoading || !isSuperAdmin || activeTab !== "logs") return;
    void loadLogs();
  }, [authLoading, isSuperAdmin, activeTab, loadLogs]);

  const refreshObservability = useCallback(async () => {
    if (!isSuperAdmin) return;
    setObsLoading(true);
    try {
      setObsStats(await adminService.getLogStatistics(obsRange));
    } catch {
      setObsStats(null);
    } finally {
      setObsLoading(false);
    }
  }, [isSuperAdmin, obsRange]);

  useEffect(() => {
    if (authLoading || !isSuperAdmin || activeTab !== "observability") return;
    void refreshObservability();
  }, [authLoading, isSuperAdmin, activeTab, obsRange, refreshObservability]);

  const loadHistory = useCallback(
    async (pageOverride?: number) => {
      if (!isSuperAdmin) return;
      setHistoryLoading(true);
      try {
        const p = pageOverride ?? historyPage;
        const offset = (p - 1) * HISTORY_PAGE_SIZE;
        const res = await adminService.getUserHistory({
          userId: historyUserId.trim() || undefined,
          eventType: historyEventType || undefined,
          limit: HISTORY_PAGE_SIZE,
          offset,
        });
        setHistoryItems(res.items);
        setHistoryTotal(res.pageInfo.total);
      } catch {
        setHistoryItems([]);
        setHistoryTotal(0);
      } finally {
        setHistoryLoading(false);
      }
    },
    [isSuperAdmin, historyPage, historyUserId, historyEventType],
  );

  useEffect(() => {
    if (authLoading || !isSuperAdmin || activeTab !== "history") return;
    void loadHistory();
  }, [authLoading, isSuperAdmin, activeTab, loadHistory]);

  const handleUpdateRole = async () => {
    if (!editUser || !editRole.trim()) return;
    setUpdatingRole(true);
    try {
      await adminService.updateUserRole(editUser.id, editRole.trim());
      toast.success(`Role updated to ${editRole}`);
      setEditUser(null);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id ? { ...u, role: editRole.trim() } : u,
        ),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!creditUserId.trim()) return;
    setUpdatingCredits(true);
    try {
      await adminService.updateUserCredits({
        userId: creditUserId.trim(),
        credits: creditAmount,
      });
      toast.success("Credits updated successfully.");
      setCreditUserId("");
      setCreditAmount(0);
      setCreditReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update credits");
    } finally {
      setUpdatingCredits(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const u = confirm.user;
    setConfirmBusy(true);
    try {
      if (confirm.kind === "delete") {
        await adminService.deleteUser(u.id);
        toast.success("User deleted");
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
      } else if (confirm.kind === "promoteAdmin") {
        await adminService.promoteToAdmin(u.id);
        toast.success("Promoted to admin");
        await loadUsersAndStats();
      } else {
        await adminService.promoteToSuperAdmin(u.id);
        toast.success("Promoted to SuperAdmin");
        await loadUsersAndStats();
      }
      setConfirm(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setConfirmBusy(false);
    }
  };

  if (authLoading)
    return <div className="c360-spinner c360-mx-auto c360-mt-20" />;

  return (
    <div className="c360-page c360-p-6">
      <div className="c360-standalone-header">
        <h1 className="c360-standalone-header__title">Admin Dashboard</h1>
        <p className="c360-standalone-header__subtitle">
          Platform overview and user management
        </p>
      </div>

      {!isSuperAdmin && (
        <Alert variant="info" className="c360-mb-4">
          You are signed in as <strong>Admin</strong>. SuperAdmin-only tools
          (logs, observability, history, credits, promotions) are hidden. User
          list uses <code>usersWithBuckets</code>.
        </Alert>
      )}

      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          className="c360-mb-4"
        >
          {error}
        </Alert>
      )}

      <AdminStatGrid
        stats={stats}
        loading={loading}
        logStats={headerLogStats}
        logStatsLoading={headerLogStatsLoading}
      />

      <div className="c360-mt-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
          }}
        >
          <TabsList>
            <TabsTrigger value="users" icon={<Users size={14} />}>
              Users
            </TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="logs" icon={<FileText size={14} />}>
                  Logs
                </TabsTrigger>
                <TabsTrigger
                  value="observability"
                  icon={<BarChart2 size={14} />}
                >
                  Observability
                </TabsTrigger>
                <TabsTrigger value="history" icon={<History size={14} />}>
                  History
                </TabsTrigger>
                <TabsTrigger value="credits" icon={<CreditCard size={14} />}>
                  Credits
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="users">
            <AdminUserTable
              users={users}
              total={total}
              page={page}
              pageSize={USER_PAGE_SIZE}
              search={search}
              onSearchChange={setSearch}
              onPageChange={setPage}
              onEditRole={(u) => {
                setEditUser(u);
                setEditRole(u.role ?? "");
              }}
              isSuperAdmin={isSuperAdmin}
              onDeleteUser={
                isSuperAdmin
                  ? (u) => setConfirm({ kind: "delete", user: u })
                  : undefined
              }
              onPromoteAdmin={
                isSuperAdmin
                  ? (u) => setConfirm({ kind: "promoteAdmin", user: u })
                  : undefined
              }
              onPromoteSuper={
                isSuperAdmin
                  ? (u) => setConfirm({ kind: "promoteSuper", user: u })
                  : undefined
              }
            />
          </TabsContent>

          {isSuperAdmin && (
            <>
              <TabsContent value="logs">
                <AdminLogTable
                  logs={logs}
                  loading={logsLoading}
                  logSearch={logSearch}
                  onLogSearchChange={setLogSearch}
                  onSearch={() => {
                    setLogPage(1);
                    void loadLogs(1);
                  }}
                  level={logLevel}
                  logger={logLogger}
                  userId={logUserId}
                  startTime={logStart}
                  endTime={logEnd}
                  onLevelChange={setLogLevel}
                  onLoggerChange={setLogLogger}
                  onUserIdChange={setLogUserId}
                  onStartTimeChange={setLogStart}
                  onEndTimeChange={setLogEnd}
                  onApplyFilters={() => {
                    setLogPage(1);
                    void loadLogs(1);
                  }}
                  total={logTotal}
                  page={logPage}
                  pageSize={LOG_PAGE_SIZE}
                  onPageChange={(p) => setLogPage(p)}
                />
              </TabsContent>

              <TabsContent value="observability">
                <AdminObservabilityTab
                  timeRange={obsRange}
                  onTimeRangeChange={(r) => setObsRange(r)}
                  stats={obsStats}
                  loading={obsLoading}
                  onRefresh={() => void refreshObservability()}
                />
              </TabsContent>

              <TabsContent value="history">
                <AdminHistoryTab
                  items={historyItems}
                  total={historyTotal}
                  page={historyPage}
                  pageSize={HISTORY_PAGE_SIZE}
                  userIdFilter={historyUserId}
                  eventType={historyEventType}
                  loading={historyLoading}
                  onUserIdFilterChange={setHistoryUserId}
                  onEventTypeChange={setHistoryEventType}
                  onPageChange={(p) => setHistoryPage(p)}
                  onApply={() => {
                    setHistoryPage(1);
                    void loadHistory(1);
                  }}
                />
              </TabsContent>

              <TabsContent value="credits">
                <AdminCreditsForm
                  userId={creditUserId}
                  amount={creditAmount}
                  reason={creditReason}
                  loading={updatingCredits}
                  onUserIdChange={setCreditUserId}
                  onAmountChange={setCreditAmount}
                  onReasonChange={setCreditReason}
                  onSubmit={handleUpdateCredits}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <Modal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Edit Role — ${editUser?.fullName ?? editUser?.email ?? ""}`}
        size="sm"
      >
        <div className="c360-section-stack">
          <p className="c360-text-sm c360-text-muted">
            User: <strong>{editUser?.email}</strong>
          </p>
          <div>
            <label
              htmlFor="edit-user-role-select"
              className="c360-form-label-block"
            >
              Role
            </label>
            <select
              id="edit-user-role-select"
              aria-label="User role"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="c360-search-box__input c360-py-2 c360-px-3"
            >
              {["User", "Admin", "SuperAdmin"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="c360-badge-row">
            <Button
              variant="secondary"
              className="c360-flex-1"
              onClick={() => setEditUser(null)}
            >
              Cancel
            </Button>
            <Button
              className="c360-flex-1"
              loading={updatingRole}
              onClick={handleUpdateRole}
              disabled={!editRole.trim()}
            >
              Save Role
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!confirm}
        onClose={() => !confirmBusy && setConfirm(null)}
        title={
          confirm?.kind === "delete"
            ? "Delete user"
            : confirm?.kind === "promoteAdmin"
              ? "Promote to admin"
              : "Promote to SuperAdmin"
        }
        size="sm"
      >
        {confirm && (
          <div className="c360-section-stack">
            <p className="c360-text-sm">
              {confirm.kind === "delete"
                ? `Permanently delete ${confirm.user.email}? This cannot be undone.`
                : confirm.kind === "promoteAdmin"
                  ? `Promote ${confirm.user.email} to Admin?`
                  : `Promote ${confirm.user.email} to SuperAdmin?`}
            </p>
            <div className="c360-badge-row">
              <Button
                variant="secondary"
                className="c360-flex-1"
                disabled={confirmBusy}
                onClick={() => setConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                variant={confirm.kind === "delete" ? "danger" : "primary"}
                className="c360-flex-1"
                loading={confirmBusy}
                onClick={() => void runConfirm()}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

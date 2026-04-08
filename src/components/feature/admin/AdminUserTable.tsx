"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/patterns/SearchBar";
import { Pagination } from "@/components/patterns/Pagination";
import { type AdminUser } from "@/services/graphql/adminService";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

interface AdminUserTableProps {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  onSearchChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onEditRole: (user: AdminUser) => void;
  showBucketColumn?: boolean;
  isSuperAdmin?: boolean;
  onDeleteUser?: (user: AdminUser) => void;
  onPromoteAdmin?: (user: AdminUser) => void;
  onPromoteSuper?: (user: AdminUser) => void;
}

export function AdminUserTable({
  users,
  total,
  page,
  pageSize,
  search,
  onSearchChange,
  onPageChange,
  onEditRole,
  showBucketColumn,
  isSuperAdmin,
  onDeleteUser,
  onPromoteAdmin,
  onPromoteSuper,
}: AdminUserTableProps) {
  const showBucket =
    showBucketColumn ?? users.some((u) => u.bucket != null && u.bucket !== "");

  return (
    <Card
      title="Users"
      actions={
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Filter this page (client-side)…"
        />
      }
    >
      {!isSuperAdmin && (
        <p className="c360-text-sm c360-text-muted c360-mb-3">
          Admin view: read-only directory. Role changes and promotions require
          SuperAdmin.
        </p>
      )}
      <div className="c360-table-wrapper">
        <table className="c360-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              {showBucket && <th>Bucket</th>}
              <th>Role</th>
              <th>Plan</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Last Login</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="c360-fw-medium">{u.fullName}</td>
                <td className="c360-text-sm c360-text-muted">{u.email}</td>
                {showBucket && (
                  <td className="c360-text-xs c360-text-muted">
                    {u.bucket ?? "—"}
                  </td>
                )}
                <td>
                  <Badge
                    color={
                      u.role.includes("super")
                        ? "accent"
                        : u.role === "admin"
                          ? "primary"
                          : "secondary"
                    }
                  >
                    {u.role}
                  </Badge>
                </td>
                <td>
                  <Badge
                    color={
                      u.plan === "enterprise"
                        ? "accent"
                        : u.plan === "pro" || u.plan === "professional"
                          ? "primary"
                          : "secondary"
                    }
                  >
                    {u.plan}
                  </Badge>
                </td>
                <td className="c360-text-sm">{formatNumber(u.credits)}</td>
                <td>
                  <Badge color={u.isActive ? "success" : "danger"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="c360-text-sm c360-text-muted">
                  {u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : "Never"}
                </td>
                <td>
                  <div className="c360-flex c360-flex-col c360-gap-1">
                    {isSuperAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditRole(u)}
                        >
                          Edit role
                        </Button>
                        {onPromoteAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPromoteAdmin(u)}
                          >
                            Promote admin
                          </Button>
                        )}
                        {onPromoteSuper && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onPromoteSuper(u)}
                          >
                            Promote super
                          </Button>
                        )}
                        {onDeleteUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteUser(u)}
                          >
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="c360-table-footer">
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </div>
    </Card>
  );
}

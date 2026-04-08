"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { type SessionRow as Session } from "@/services/graphql/profileService";

interface ProfileSessionsTabProps {
  sessions: Session[];
  loading: boolean;
  onRevokeSession: (id: string) => void;
  onRevokeAll: () => void;
}

export function ProfileSessionsTab({
  sessions,
  loading,
  onRevokeSession,
  onRevokeAll,
}: ProfileSessionsTabProps) {
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  return (
    <Card
      title="Active Sessions"
      actions={
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={() => setConfirmRevokeAll(true)}
        >
          Revoke all other sessions
        </Button>
      }
    >
      {loading ? (
        <p className="c360-text-muted c360-p-4">Loading…</p>
      ) : sessions.length === 0 ? (
        <div className="c360-empty-state">
          <p className="c360-empty-state__desc">No sessions found.</p>
        </div>
      ) : (
        <div className="c360-section-stack">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="c360-stat-tile c360-flex c360-justify-between c360-items-center"
            >
              <div>
                <p className="c360-session-row__ua c360-m-0">
                  {s.userAgent?.slice(0, 80) || "Unknown device"}
                  {s.isCurrent && (
                    <Badge color="green" className="c360-text-xs c360-ml-2">
                      This device
                    </Badge>
                  )}
                </p>
                <p className="c360-session-row__meta c360-m-0">
                  {s.ipAddress ?? "—"} · Last active{" "}
                  {new Date(s.lastActivity).toLocaleString()}
                </p>
              </div>
              {!s.isCurrent && (
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={() => setRevokeId(s.id)}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={revokeId !== null}
        onClose={() => setRevokeId(null)}
        title="Revoke this session?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setRevokeId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                if (revokeId) onRevokeSession(revokeId);
                setRevokeId(null);
              }}
            >
              Revoke session
            </Button>
          </>
        }
      >
        <p className="c360-text-sm c360-m-0">
          That device will be signed out and need to sign in again.
        </p>
      </Modal>

      <Modal
        isOpen={confirmRevokeAll}
        onClose={() => setConfirmRevokeAll(false)}
        title="Sign out all other devices?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setConfirmRevokeAll(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                onRevokeAll();
                setConfirmRevokeAll(false);
              }}
            >
              Revoke others
            </Button>
          </>
        }
      >
        <p className="c360-text-sm c360-m-0">
          Every session except this browser will be ended. You will stay signed
          in here.
        </p>
      </Modal>
    </Card>
  );
}

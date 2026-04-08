"use client";

import { useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { type TeamMemberRow as TeamMember } from "@/services/graphql/profileService";

/** Matches `InviteTeamMemberInput` defaults and typical stored roles. */
const TEAM_ROLES = ["Member", "Admin", "Owner"] as const;

function canonicalTeamRole(role: string): (typeof TEAM_ROLES)[number] {
  const r = role.trim();
  if ((TEAM_ROLES as readonly string[]).includes(r)) {
    return r as (typeof TEAM_ROLES)[number];
  }
  const lower = r.toLowerCase();
  if (lower === "member") return "Member";
  if (lower === "admin") return "Admin";
  if (lower === "owner") return "Owner";
  return "Member";
}

interface ProfileTeamTabProps {
  teamMembers: TeamMember[];
  loading: boolean;
  teamError: string | null;
  teamForbidden: boolean;
  inviting: boolean;
  updatingRoleId: string | null;
  onInvite: (input: { email: string; role: string }) => Promise<void>;
  onUpdateRole: (id: string, role: string) => void;
  onRemoveMember: (id: string) => void;
}

export function ProfileTeamTab({
  teamMembers,
  loading,
  teamError,
  teamForbidden,
  inviting,
  updatingRoleId,
  onInvite,
  onUpdateRole,
  onRemoveMember,
}: ProfileTeamTabProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("Member");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    await onInvite({ email, role: inviteRole });
    setInviteEmail("");
  };

  return (
    <Card
      title="Team members"
      subtitle="Invite teammates to collaborate (owner-only)."
    >
      <div className="c360-section-stack">
        {teamForbidden ? (
          <div className="c360-empty-state">
            <Users size={36} className="c360-empty-state__icon" />
            <p className="c360-empty-state__title">
              Team management is available to account owners
            </p>
            <p className="c360-empty-state__desc">
              Contact the account owner to manage team members.
            </p>
          </div>
        ) : (
          <>
            <div className="c360-flex c360-gap-3 c360-flex-wrap">
              <div className="c360-profile-team-invite-field">
                <Input
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleInvite()}
                  type="email"
                  autoComplete="email"
                />
              </div>
              <div className="c360-field c360-profile-team-role-field">
                <label className="c360-label" htmlFor="profile-invite-role">
                  Role
                </label>
                <select
                  id="profile-invite-role"
                  className="c360-input c360-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  title="Invite role"
                  aria-label="Invite role"
                >
                  {TEAM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="c360-flex c360-items-end">
                <Button
                  loading={inviting}
                  type="button"
                  onClick={() => void handleInvite()}
                >
                  <Plus size={16} /> Invite
                </Button>
              </div>
            </div>
            {teamError && <Alert variant="danger">{teamError}</Alert>}
            {loading ? (
              <p className="c360-text-muted">Loading…</p>
            ) : teamMembers.length === 0 ? (
              <div className="c360-empty-state">
                <p className="c360-empty-state__desc">No team members yet.</p>
              </div>
            ) : (
              <div className="c360-section-stack c360-gap-2">
                {teamMembers.map((m) => (
                  <div key={m.id} className="c360-team-row">
                    <div className="c360-team-row__body">
                      <p className="c360-team-row__name c360-m-0">
                        {m.name || m.email}
                      </p>
                      <p className="c360-team-row__email c360-m-0">{m.email}</p>
                    </div>
                    <div className="c360-flex c360-items-center c360-gap-2">
                      <Badge color={m.status === "active" ? "green" : "orange"}>
                        {m.status}
                      </Badge>
                      <select
                        value={canonicalTeamRole(m.role)}
                        disabled={updatingRoleId === m.id}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== m.role) onUpdateRole(m.id, newRole);
                        }}
                        className="c360-select"
                        aria-label={`Role for ${m.email}`}
                      >
                        {TEAM_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => setRemoveId(m.id)}
                        aria-label={`Remove ${m.email}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={removeId !== null}
        onClose={() => setRemoveId(null)}
        title="Remove team member?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setRemoveId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                if (removeId) onRemoveMember(removeId);
                setRemoveId(null);
              }}
            >
              Remove
            </Button>
          </>
        }
      >
        <p className="c360-text-sm c360-m-0">
          They will lose access to this workspace. You can invite them again
          later.
        </p>
      </Modal>
    </Card>
  );
}

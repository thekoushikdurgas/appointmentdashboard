"use client";
import { useState, useEffect, useCallback } from "react";
import type { CreateApiKeyInput } from "@/graphql/generated/types";
import {
  profileService,
  ApiKeyRow,
  SessionRow,
  TeamMemberRow,
} from "@/services/graphql/profileService";

export function useProfile() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamForbidden, setTeamForbidden] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTeamError(null);
    setTeamForbidden(false);
    try {
      const [keysRes, sessionsRes, teamRes] = await Promise.allSettled([
        profileService.getApiKeys(),
        profileService.getSessions(),
        profileService.listTeamMembers(),
      ]);
      if (keysRes.status === "fulfilled") setApiKeys(keysRes.value.keys);
      if (sessionsRes.status === "fulfilled")
        setSessions(sessionsRes.value.sessions);
      if (teamRes.status === "fulfilled") {
        setTeamMembers(teamRes.value.members);
      } else {
        const msg =
          teamRes.reason instanceof Error
            ? teamRes.reason.message
            : String(teamRes.reason);
        if (
          msg.toLowerCase().includes("403") ||
          msg.toLowerCase().includes("forbidden") ||
          msg.toLowerCase().includes("permission")
        ) {
          setTeamForbidden(true);
        } else {
          setTeamError(msg);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const createApiKey = useCallback(async (input: CreateApiKeyInput) => {
    const res = await profileService.createApiKey(input);
    const newKey = res.profile.createAPIKey;
    setApiKeys((prev) => [newKey, ...prev]);
    return newKey;
  }, []);

  const deleteApiKey = useCallback(async (id: string) => {
    await profileService.deleteApiKey(id);
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const revokeSession = useCallback(async (id: string) => {
    await profileService.revokeSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const revokeAllOtherSessions = useCallback(async () => {
    await profileService.revokeAllOtherSessions();
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  }, []);

  const inviteTeamMember = useCallback(
    async (input: { email: string; role?: string }) => {
      const res = await profileService.inviteTeamMember(input);
      const member = res.profile.inviteTeamMember;
      setTeamMembers((prev) => [...prev, member]);
      return member;
    },
    [],
  );

  const updateTeamMemberRole = useCallback(
    async (memberId: string, role: string) => {
      const res = await profileService.updateTeamMemberRole(memberId, role);
      const updated = res.profile.updateTeamMemberRole;
      setTeamMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...updated } : m)),
      );
    },
    [],
  );

  const removeTeamMember = useCallback(async (memberId: string) => {
    await profileService.removeTeamMember(memberId);
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
  }, []);

  return {
    apiKeys,
    sessions,
    teamMembers,
    loading,
    error,
    teamError,
    teamForbidden,
    createApiKey,
    deleteApiKey,
    revokeSession,
    revokeAllOtherSessions,
    inviteTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    refresh: fetchAll,
  };
}

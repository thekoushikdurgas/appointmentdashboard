"use client";
import { useState, useEffect, useCallback } from "react";
import type { CreateApiKeyInput } from "@/graphql/generated/types";
import {
  profileService,
  ApiKeyRow,
  SessionRow,
  TeamMemberRow,
} from "@/services/graphql/profileService";
import {
  readTTLCache,
  writeTTLCache,
  clearTTLCache,
} from "@/lib/ttlLocalStorageCache";

const PROFILE_CACHE_KEY = "c360:profile:v1";
const PROFILE_TTL_MS = 5 * 60 * 1000;

interface ProfileCache {
  apiKeys: ApiKeyRow[];
  teamMembers: TeamMemberRow[];
}

export function useProfile() {
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>(
    () => readTTLCache<ProfileCache>(PROFILE_CACHE_KEY)?.apiKeys ?? [],
  );
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>(
    () => readTTLCache<ProfileCache>(PROFILE_CACHE_KEY)?.teamMembers ?? [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamForbidden, setTeamForbidden] = useState(false);

  const fetchAll = useCallback(async (invalidateCache = false) => {
    if (invalidateCache) clearTTLCache(PROFILE_CACHE_KEY);

    setLoading(true);
    setError(null);
    setTeamError(null);
    setTeamForbidden(false);
    try {
      const cached = invalidateCache
        ? null
        : readTTLCache<ProfileCache>(PROFILE_CACHE_KEY);

      const [keysRes, sessionsRes, teamRes] = await Promise.allSettled([
        cached ? Promise.resolve(null) : profileService.getApiKeys(),
        profileService.getSessions(),
        cached ? Promise.resolve(null) : profileService.listTeamMembers(),
      ]);

      let newApiKeys = apiKeys;
      let newTeamMembers = teamMembers;

      if (keysRes.status === "fulfilled" && keysRes.value) {
        newApiKeys = keysRes.value.keys;
        setApiKeys(newApiKeys);
      } else if (cached) {
        newApiKeys = cached.apiKeys;
      }

      if (sessionsRes.status === "fulfilled")
        setSessions(sessionsRes.value.sessions);

      if (teamRes.status === "fulfilled" && teamRes.value) {
        newTeamMembers = teamRes.value.members;
        setTeamMembers(newTeamMembers);
      } else if (cached) {
        newTeamMembers = cached.teamMembers;
      } else if (teamRes.status === "rejected") {
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

      writeTTLCache<ProfileCache>(
        PROFILE_CACHE_KEY,
        { apiKeys: newApiKeys, teamMembers: newTeamMembers },
        PROFILE_TTL_MS,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const createApiKey = useCallback(async (input: CreateApiKeyInput) => {
    const res = await profileService.createApiKey(input);
    const newKey = res.profile.createAPIKey;
    setApiKeys((prev) => {
      const updated = [newKey, ...prev];
      clearTTLCache(PROFILE_CACHE_KEY);
      return updated;
    });
    return newKey;
  }, []);

  const deleteApiKey = useCallback(async (id: string) => {
    await profileService.deleteApiKey(id);
    setApiKeys((prev) => {
      const updated = prev.filter((k) => k.id !== id);
      clearTTLCache(PROFILE_CACHE_KEY);
      return updated;
    });
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
      setTeamMembers((prev) => {
        const updated = [...prev, member];
        clearTTLCache(PROFILE_CACHE_KEY);
        return updated;
      });
      return member;
    },
    [],
  );

  const updateTeamMemberRole = useCallback(
    async (memberId: string, role: string) => {
      const res = await profileService.updateTeamMemberRole(memberId, role);
      const updated = res.profile.updateTeamMemberRole;
      setTeamMembers((prev) => {
        const next = prev.map((m) =>
          m.id === memberId ? { ...m, ...updated } : m,
        );
        clearTTLCache(PROFILE_CACHE_KEY);
        return next;
      });
    },
    [],
  );

  const removeTeamMember = useCallback(async (memberId: string) => {
    await profileService.removeTeamMember(memberId);
    setTeamMembers((prev) => {
      const updated = prev.filter((m) => m.id !== memberId);
      clearTTLCache(PROFILE_CACHE_KEY);
      return updated;
    });
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
    refresh: () => fetchAll(true),
  };
}

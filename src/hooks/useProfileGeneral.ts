"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usersService } from "@/services/graphql/usersService";
import {
  assertAvatarFileSize,
  readFileAsDataURL,
} from "@/lib/profileAvatarUpload";

export function useProfileGeneral() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || "");
    setJobTitle(user.job_title ?? "");
    setBio(user.bio ?? "");
    setTimezone(user.timezone ?? "");
  }, [user]);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const resetToUser = useCallback(() => {
    if (!user) return;
    setFullName(user.full_name || "");
    setJobTitle(user.job_title ?? "");
    setBio(user.bio ?? "");
    setTimezone(user.timezone ?? "");
    setFormError(null);
  }, [user]);

  const save = useCallback(async () => {
    if (!user) return;
    setFormError(null);
    setSaving(true);
    try {
      const nameTrim = fullName.trim();
      const prevName = (user.full_name || "").trim();
      if (nameTrim && nameTrim !== prevName) {
        await usersService.updateUser({ name: nameTrim });
      }
      await usersService.updateProfile({
        jobTitle: jobTitle.trim() || null,
        bio: bio.trim() || null,
        timezone: timezone.trim() || null,
      });
      await refreshUser();
      if (successTimer.current) clearTimeout(successTimer.current);
      setSaveSuccess(true);
      successTimer.current = setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [fullName, jobTitle, bio, timezone, user, refreshUser]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      setFormError(null);
      try {
        assertAvatarFileSize(file);
      } catch (e) {
        setFormError(e instanceof Error ? e.message : String(e));
        return;
      }
      setAvatarUploading(true);
      try {
        const fileData = await readFileAsDataURL(file);
        await usersService.uploadAvatar({ fileData });
        await refreshUser();
      } catch (e) {
        setFormError(e instanceof Error ? e.message : String(e));
      } finally {
        setAvatarUploading(false);
      }
    },
    [refreshUser],
  );

  return {
    fullName,
    setFullName,
    jobTitle,
    setJobTitle,
    bio,
    setBio,
    timezone,
    setTimezone,
    saving,
    saveSuccess,
    formError,
    avatarUploading,
    save,
    resetToUser,
    uploadAvatar,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Key, Monitor, Settings, Shield, User, Users } from "lucide-react";
import { toast } from "sonner";
import DashboardPageLayout from "@/components/layouts/DashboardPageLayout";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useProfileGeneral } from "@/hooks/useProfileGeneral";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ProfileInfoTab } from "@/components/feature/profile/ProfileInfoTab";
import { ProfileSecurityTab } from "@/components/feature/profile/ProfileSecurityTab";
import { ProfileApiKeysTab } from "@/components/feature/profile/ProfileApiKeysTab";
import { ProfileSessionsTab } from "@/components/feature/profile/ProfileSessionsTab";
import { ProfileTeamTab } from "@/components/feature/profile/ProfileTeamTab";
import { ProfileSettingsTab } from "@/components/feature/profile/ProfileSettingsTab";
import { EmailOtpModal } from "@/components/feature/auth/EmailOtpModal";
import { authService } from "@/services/graphql/authService";
import { setTokens } from "@/lib/tokenManager";
import { isProfileTab, type ProfileTab } from "@/lib/profileTabs";
import type { CreateApiKeyInput } from "@/graphql/generated/types";

const TABS: Array<{ id: ProfileTab; label: string; icon: React.ReactNode }> = [
  { id: "general", label: "General", icon: <User size={16} /> },
  { id: "security", label: "Security & 2FA", icon: <Shield size={16} /> },
  { id: "apikeys", label: "API Keys", icon: <Key size={16} /> },
  { id: "sessions", label: "Sessions", icon: <Monitor size={16} /> },
  { id: "team", label: "Team", icon: <Users size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlTab = searchParams.get("tab");
  const initialTab: ProfileTab = isProfileTab(urlTab) ? urlTab : "general";

  const { user, refreshUser } = useAuth();
  const {
    apiKeys,
    sessions,
    teamMembers,
    loading,
    error: profileError,
    teamError,
    teamForbidden,
    createApiKey,
    deleteApiKey,
    revokeSession,
    revokeAllOtherSessions,
    inviteTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
  } = useProfile();

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const {
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
    formError: generalFormError,
    avatarUploading,
    save: saveGeneral,
    resetToUser: resetGeneralForm,
    uploadAvatar,
  } = useProfileGeneral();

  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [inviting, setInviting] = useState(false);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyChallenge, setVerifyChallenge] = useState<{
    challengeToken: string;
    email: string;
  } | null>(null);
  const [verifyRequestLoading, setVerifyRequestLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [verifyOtpError, setVerifyOtpError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (isProfileTab(t)) setActiveTab(t);
    else if (!t) setActiveTab("general");
  }, [searchParams]);

  const handleTabChange = useCallback(
    (v: string) => {
      const next = isProfileTab(v) ? v : "general";
      setActiveTab(next);
      const p = new URLSearchParams(searchParams.toString());
      if (next === "general") p.delete("tab");
      else p.set("tab", next);
      const qs = p.toString();
      router.replace(qs ? `/profile?${qs}` : "/profile", { scroll: false });
    },
    [router, searchParams],
  );

  const handleCreateApiKey = async (input: CreateApiKeyInput) => {
    setCreatingKey(true);
    try {
      const key = await createApiKey(input);
      if (key.key) setNewKeyValue(key.key);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleCopyKey = async () => {
    if (newKeyValue) {
      await navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInvite = async (input: { email: string; role: string }) => {
    setInviting(true);
    try {
      await inviteTeamMember({
        email: input.email,
        role: input.role,
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRequestEmailVerification = useCallback(async () => {
    setVerifyRequestLoading(true);
    setVerifyOtpError(null);
    try {
      const payload = await authService.requestEmailVerification();
      setVerifyChallenge({
        challengeToken: payload.challengeToken,
        email: payload.email,
      });
      setVerifyModalOpen(true);
      toast.success("Verification code sent", {
        description: `Check ${payload.email} for your 4-digit code.`,
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not send verification code.",
      );
    } finally {
      setVerifyRequestLoading(false);
    }
  }, []);

  const handleVerifyProfileEmailOtp = useCallback(
    async (code: string) => {
      if (!verifyChallenge) return;
      setVerifyOtpLoading(true);
      setVerifyOtpError(null);
      try {
        const result = await authService.verifyRegistrationOtp(
          verifyChallenge.challengeToken,
          code,
        );
        setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        setVerifyModalOpen(false);
        setVerifyChallenge(null);
        await refreshUser(true);
        toast.success("Email verified");
      } catch (err) {
        setVerifyOtpError(
          err instanceof Error ? err.message : "Invalid verification code.",
        );
        throw err;
      } finally {
        setVerifyOtpLoading(false);
      }
    },
    [verifyChallenge, refreshUser],
  );

  const handleResendProfileEmailOtp = useCallback(async () => {
    if (!verifyChallenge) return;
    setVerifyOtpError(null);
    try {
      await authService.resendRegistrationOtp(verifyChallenge.challengeToken);
      toast.success("Verification code sent");
    } catch (err) {
      setVerifyOtpError(
        err instanceof Error ? err.message : "Could not resend code.",
      );
      throw err;
    }
  }, [verifyChallenge]);

  const handleCloseVerifyModal = useCallback(() => {
    setVerifyModalOpen(false);
    setVerifyOtpError(null);
  }, []);

  const handleUpdateRole = async (id: string, role: string) => {
    setUpdatingRoleId(id);
    try {
      await updateTeamMemberRole(id, role);
    } catch {
      // error surfaced in teamError
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <DashboardPageLayout>
      {profileError && (
        <Alert variant="danger" className="c360-mb-4">
          {profileError}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        variant="floating"
        className="c360-tabs--profile c360-tabs--floating-bottom"
      >
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} icon={tab.icon}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="c360-mt-6">
          <ProfileInfoTab
            avatarUrl={user?.avatar_url}
            isVerified={Boolean(user?.is_verified)}
            verifyEmailLoading={verifyRequestLoading}
            onVerifyEmail={() => void handleRequestEmailVerification()}
            email={user?.email || ""}
            fullName={fullName}
            jobTitle={jobTitle}
            bio={bio}
            timezone={timezone}
            saving={saving}
            saveSuccess={saveSuccess}
            formError={generalFormError}
            avatarUploading={avatarUploading}
            onFullNameChange={setFullName}
            onJobTitleChange={setJobTitle}
            onBioChange={setBio}
            onTimezoneChange={setTimezone}
            onSave={() => void saveGeneral()}
            onCancel={resetGeneralForm}
            onAvatarFile={(file) => void uploadAvatar(file)}
          />
        </TabsContent>

        <TabsContent value="security" className="c360-mt-6">
          <ProfileSecurityTab />
        </TabsContent>

        <TabsContent value="apikeys" className="c360-mt-6">
          <ProfileApiKeysTab
            apiKeys={apiKeys}
            loading={loading}
            creatingKey={creatingKey}
            newKeyValue={newKeyValue}
            copied={copied}
            onCreateKey={async (input) => {
              await handleCreateApiKey(input);
            }}
            onDeleteKey={(id) => void deleteApiKey(id)}
            onCopyKey={handleCopyKey}
          />
        </TabsContent>

        <TabsContent value="sessions" className="c360-mt-6">
          <ProfileSessionsTab
            sessions={sessions}
            loading={loading}
            onRevokeSession={(id) => void revokeSession(id)}
            onRevokeAll={() => void revokeAllOtherSessions()}
          />
        </TabsContent>

        <TabsContent value="team" className="c360-mt-6">
          <ProfileTeamTab
            teamMembers={teamMembers}
            loading={loading}
            teamError={teamError}
            teamForbidden={teamForbidden}
            inviting={inviting}
            updatingRoleId={updatingRoleId}
            onInvite={async (input) => {
              await handleInvite(input);
            }}
            onUpdateRole={handleUpdateRole}
            onRemoveMember={(id) => void removeTeamMember(id)}
          />
        </TabsContent>

        <TabsContent value="settings" className="c360-mt-6">
          <ProfileSettingsTab />
        </TabsContent>
      </Tabs>

      {verifyChallenge ? (
        <EmailOtpModal
          isOpen={verifyModalOpen}
          email={verifyChallenge.email}
          purpose="registration"
          loading={verifyOtpLoading}
          error={verifyOtpError}
          onVerify={handleVerifyProfileEmailOtp}
          onResend={handleResendProfileEmailOtp}
          onClose={handleCloseVerifyModal}
        />
      ) : null}
    </DashboardPageLayout>
  );
}

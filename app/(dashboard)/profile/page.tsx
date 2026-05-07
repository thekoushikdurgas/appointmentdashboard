"use client";

import { useState } from "react";
import { User, Shield, Key, Monitor, Users } from "lucide-react";
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
import type { CreateApiKeyInput } from "@/graphql/generated/types";

type ProfileTab = "general" | "security" | "apikeys" | "sessions" | "team";

const TABS: Array<{ id: ProfileTab; label: string; icon: React.ReactNode }> = [
  { id: "general", label: "General", icon: <User size={16} /> },
  { id: "security", label: "Security & 2FA", icon: <Shield size={16} /> },
  { id: "apikeys", label: "API Keys", icon: <Key size={16} /> },
  { id: "sessions", label: "Sessions", icon: <Monitor size={16} /> },
  { id: "team", label: "Team", icon: <Users size={16} /> },
];

export default function ProfilePage() {
  const { user } = useAuth();
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

  const [activeTab, setActiveTab] = useState<ProfileTab>("general");
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
        onValueChange={(v) => setActiveTab(v as ProfileTab)}
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
      </Tabs>
    </DashboardPageLayout>
  );
}

"use client";

import { useRef } from "react";
import { User, FileImage } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";

interface ProfileInfoTabProps {
  email: string;
  fullName: string;
  jobTitle: string;
  bio: string;
  timezone: string;
  saving: boolean;
  saveSuccess: boolean;
  formError: string | null;
  avatarUploading: boolean;
  onFullNameChange: (v: string) => void;
  onJobTitleChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onTimezoneChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarFile: (file: File) => void;
}

export function ProfileInfoTab({
  email,
  fullName,
  jobTitle,
  bio,
  timezone,
  saving,
  saveSuccess,
  formError,
  avatarUploading,
  onFullNameChange,
  onJobTitleChange,
  onBioChange,
  onTimezoneChange,
  onSave,
  onCancel,
  onAvatarFile,
}: ProfileInfoTabProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card title="Personal Information" className="c360-max-w-560">
      {formError && (
        <Alert variant="danger" className="c360-mb-4">
          {formError}
        </Alert>
      )}
      {saveSuccess && (
        <Alert variant="success" className="c360-mb-4">
          Profile saved successfully.
        </Alert>
      )}
      <div className="c360-section-stack">
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="c360-sr-only"
            aria-label="Choose profile photo file"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onAvatarFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="secondary"
            loading={avatarUploading}
            onClick={() => fileRef.current?.click()}
          >
            <FileImage size={16} className="c360-mr-2" aria-hidden />
            Change profile photo
          </Button>
          <p className="c360-text-muted c360-text-sm c360-mt-2 c360-mb-0">
            JPEG, PNG, GIF, or WebP — up to 5MB. Uses{" "}
            <code className="c360-text-xs">users.uploadAvatar</code> (
            <code className="c360-text-xs">fileData</code>).
          </p>
          {avatarUploading && (
            <Progress
              indeterminate
              className="c360-mt-3"
              label="Uploading photo"
            />
          )}
        </div>
        <Input
          label="Full name"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          leftIcon={<User size={16} />}
        />
        <Input
          label="Email"
          value={email}
          disabled
          helperText="Email cannot be changed here. Contact support if needed."
        />
        <Input
          label="Job title"
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
          placeholder="e.g. Sales Manager"
        />
        <Input
          label="Bio"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Short bio..."
        />
        <Input
          label="Timezone"
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          placeholder="e.g. America/New_York or UTC"
          helperText="IANA name or UTC; stored on your profile."
        />
        <div className="c360-flex c360-gap-3">
          <Button loading={saving} onClick={onSave}>
            Save changes
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

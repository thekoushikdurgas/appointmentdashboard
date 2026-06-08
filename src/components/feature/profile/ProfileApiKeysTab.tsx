"use client";

import { Card } from "@/components/ui/Card";
import { type ApiKeyRow as ApiKey } from "@/services/graphql/profileService";
import type { CreateApiKeyInput } from "@/graphql/generated/types";

interface ProfileApiKeysTabProps {
  apiKeys: ApiKey[];
  loading: boolean;
  newKeyValue: string | null;
  copied: boolean;
  creatingKey: boolean;
  onCreateKey: (input: CreateApiKeyInput) => Promise<void>;
  onDeleteKey: (id: string) => void;
  onCopyKey: () => void;
}

export function ProfileApiKeysTab(_props: ProfileApiKeysTabProps) {
  return (
    <Card
      title="API Keys"
      subtitle="Use API keys to access Contact360 programmatically"
    >
      <div className="c360-empty-state">
        <p className="c360-empty-state__title">Coming Soon</p>
        <p className="c360-empty-state__desc">
          Create and manage API keys for programmatic access in a future
          release.
        </p>
      </div>
    </Card>
  );
}

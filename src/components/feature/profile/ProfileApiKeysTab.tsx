"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, CheckCircle, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { type ApiKeyRow as ApiKey } from "@/services/graphql/profileService";
import type { CreateApiKeyInput } from "@/graphql/generated/types";
import {
  downloadTextFile,
  expiresAtFromDatetimeLocal,
} from "@/lib/profileUtils";
import { toast } from "sonner";

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

export function ProfileApiKeysTab({
  apiKeys,
  loading,
  newKeyValue,
  copied,
  creatingKey,
  onCreateKey,
  onDeleteKey,
  onCopyKey,
}: ProfileApiKeysTabProps) {
  const [keyName, setKeyName] = useState("");
  const [readAccess, setReadAccess] = useState(true);
  const [writeAccess, setWriteAccess] = useState(false);
  const [expiresLocal, setExpiresLocal] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [lastCreatedName, setLastCreatedName] = useState("");

  const handleCreate = async () => {
    const name = keyName.trim();
    if (!name) {
      toast.error("Enter a name for this API key.");
      return;
    }
    const expiresAt = expiresAtFromDatetimeLocal(expiresLocal);
    if (expiresLocal.trim() && !expiresAt) {
      toast.error("Invalid expiration date.");
      return;
    }
    const input: CreateApiKeyInput = {
      name,
      readAccess,
      writeAccess,
      ...(expiresAt ? { expiresAt } : {}),
    };
    try {
      await onCreateKey(input);
      setLastCreatedName(name);
      setKeyName("");
      setExpiresLocal("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create API key");
    }
  };

  const downloadKey = () => {
    if (!newKeyValue) return;
    const safe = lastCreatedName.replace(/[^\w\-]+/g, "_") || "api-key";
    downloadTextFile(
      `contact360-${safe}.txt`,
      `Contact360 API key (store securely — shown once)\n\n${newKeyValue}\n`,
    );
    toast.success("Download started");
  };

  return (
    <Card
      title="API Keys"
      subtitle="Use API keys to access Contact360 programmatically"
    >
      <div className="c360-section-stack">
        {newKeyValue && (
          <Alert
            variant="success"
            title="Save your key now"
            className="c360-mb-0"
          >
            <p className="c360-text-sm c360-mb-2">
              This secret is shown only once. Copy it or download a text file.
            </p>
            <div className="c360-flex c360-items-center c360-gap-2 c360-flex-wrap">
              <code className="c360-text-xs c360-api-key-code-preview">
                {newKeyValue}
              </code>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={onCopyKey}
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                leftIcon={<Download size={14} />}
                onClick={downloadKey}
              >
                .txt
              </Button>
            </div>
          </Alert>
        )}

        <div className="c360-section-stack c360-section-stack--sm">
          <Input
            label="Key name"
            placeholder="e.g. Production integration"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
          />
          <div className="c360-settings-pref-item">
            <Checkbox
              checked={readAccess}
              onChange={setReadAccess}
              label="Read access"
              description="Allow read operations with this key"
            />
          </div>
          <div className="c360-settings-pref-item">
            <Checkbox
              checked={writeAccess}
              onChange={setWriteAccess}
              label="Write access"
              description="Allow create/update/delete where applicable"
            />
          </div>
          <div className="c360-field">
            <label className="c360-label" htmlFor="api-key-expires">
              Expires (optional)
            </label>
            <input
              id="api-key-expires"
              type="datetime-local"
              className="c360-input"
              value={expiresLocal}
              onChange={(e) => setExpiresLocal(e.target.value)}
            />
            <p className="c360-text-xs c360-text-muted c360-m-0">
              Stored as ISO-8601 on the server. Leave empty for no expiry.
            </p>
          </div>
        </div>

        <div className="c360-badge-row">
          <Button
            loading={creatingKey}
            type="button"
            onClick={() => void handleCreate()}
          >
            <Plus size={16} /> Create key
          </Button>
        </div>

        {loading ? (
          <p className="c360-text-muted">Loading…</p>
        ) : apiKeys.length === 0 ? (
          <div className="c360-empty-state">
            <p className="c360-empty-state__desc">No API keys yet.</p>
          </div>
        ) : (
          <table className="c360-table">
            <thead>
              <tr>
                {["Name", "Prefix", "Access", "Created", "Last used", ""].map(
                  (h) => (
                    <th key={h}>{h}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id}>
                  <td>{key.name}</td>
                  <td className="c360-mono">{key.prefix}…</td>
                  <td className="c360-text-muted c360-text-xs">
                    {key.readAccess ? "R" : "—"}
                    {key.writeAccess ? "W" : ""}
                  </td>
                  <td className="c360-text-muted">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="c360-text-muted">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="c360-text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setDeleteId(key.id)}
                      aria-label={`Delete key ${key.name}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete API key?"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={() => {
                if (deleteId) onDeleteKey(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="c360-text-sm c360-m-0">
          Applications using this key will stop working. This cannot be undone.
        </p>
      </Modal>
    </Card>
  );
}

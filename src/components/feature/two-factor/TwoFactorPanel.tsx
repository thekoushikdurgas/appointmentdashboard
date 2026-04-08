"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldOff,
  Copy,
  RefreshCw,
  Download,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { TOTP_CODE_LENGTH, normalizeTotpCode } from "@/lib/twoFactorUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TwoFactorPanelProps {
  /** `full` matches Settings density; `compact` for Profile security tab. */
  variant?: "full" | "compact";
}

function downloadCodesFile(codes: string[], filename: string) {
  const blob = new Blob([codes.join("\n")], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function TwoFactorPanel({ variant = "full" }: TwoFactorPanelProps) {
  const {
    status,
    setupData,
    loading,
    working,
    error,
    setup,
    verify,
    disable,
    regenerateBackupCodes,
  } = useTwoFactor();

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [savedCodesAck, setSavedCodesAck] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableBackupCode, setDisableBackupCode] = useState("");
  const [regenCodes, setRegenCodes] = useState<string[]>([]);

  const enabled = status?.enabled ?? false;
  const dense = variant === "compact";

  const copy = (text: string, label = "Copied") => {
    void navigator.clipboard.writeText(text).then(() => toast.success(label));
  };

  const handleVerify = async () => {
    const code = normalizeTotpCode(otpCode);
    if (code.length !== TOTP_CODE_LENGTH) {
      setOtpError(
        `Enter exactly ${TOTP_CODE_LENGTH} digits from your authenticator app.`,
      );
      return;
    }
    if (!savedCodesAck && setupData?.backupCodes?.length) {
      setOtpError("Confirm that you saved your backup codes.");
      return;
    }
    setOtpError(null);
    const ok = await verify(code);
    if (ok) {
      toast.success("Two-factor authentication is enabled.");
      setOtpCode("");
      setSavedCodesAck(false);
    } else {
      toast.error("Invalid code — try again.");
    }
  };

  const handleDisable = async () => {
    const ok = await disable(
      disablePassword.trim() || undefined,
      disableBackupCode.trim() || undefined,
    );
    if (ok) {
      toast.success("2FA disabled.");
      setDisablePassword("");
      setDisableBackupCode("");
    } else {
      toast.error(error ?? "Failed to disable 2FA");
    }
  };

  const handleRegenerate = async () => {
    const codes = await regenerateBackupCodes();
    if (codes.length) {
      setRegenCodes(codes);
      toast.success("New backup codes generated — save them now.");
    } else {
      toast.error(error ?? "Failed to regenerate backup codes.");
    }
  };

  const headerActions = loading ? (
    <span className="c360-spinner c360-spinner--sm" />
  ) : enabled ? (
    <Badge color="green">Enabled</Badge>
  ) : (
    <Badge color="gray">Disabled</Badge>
  );

  return (
    <div className={dense ? "c360-section-stack" : "c360-2fa-panel"}>
      {!dense && (
        <div className="c360-flex c360-items-center c360-justify-between c360-gap-3 c360-flex-wrap">
          <p className="c360-page-subtitle c360-m-0">
            Use an authenticator app. Verification requires a{" "}
            <strong>{TOTP_CODE_LENGTH}-digit</strong> code (not a backup code).
          </p>
          {headerActions}
        </div>
      )}

      {dense && (
        <div className="c360-kv-row c360-items-center">
          <p className="c360-fw-medium c360-m-0">2FA status</p>
          {headerActions}
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!enabled && !setupData && (
        <div className="c360-2fa-status-row">
          <ShieldOff size={20} className="c360-text-muted" />
          <p className="c360-2fa-status-text c360-2fa-status-text--muted">
            Two-factor authentication is not enabled.
          </p>
          <Button
            size="sm"
            leftIcon={<ShieldCheck size={14} />}
            loading={working}
            onClick={() => void setup()}
          >
            Enable 2FA
          </Button>
        </div>
      )}

      {!enabled && setupData && (
        <div className="c360-2fa-setup-section">
          <ol className="c360-text-sm c360-2fa-setup-steps">
            <li>Scan the QR code or enter the key manually.</li>
            <li>Save your backup codes — they are shown only once.</li>
            <li>Enter the {TOTP_CODE_LENGTH}-digit code from the app.</li>
          </ol>

          {setupData.qrCodeUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={setupData.qrCodeUrl}
              alt="Authenticator QR code"
              className={cn("c360-2fa-qr", dense && "c360-2fa-qr--compact")}
            />
          ) : null}

          <details className="c360-2fa-manual-entry">
            <summary className="c360-text-sm">
              <ChevronDown size={14} className="c360-inline-icon" /> Can&apos;t
              scan? Use manual entry
            </summary>
            <div className="c360-2fa-secret-box c360-mt-2">
              <span className="c360-2fa-uri-text">{setupData.qrCodeData}</span>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => copy(setupData.qrCodeData, "URI copied")}
              >
                <Copy size={13} />
              </Button>
            </div>
          </details>

          <div className="c360-2fa-secret-box">
            <span className="c360-flex-1 c360-font-mono">
              {setupData.secret}
            </span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => copy(setupData.secret, "Secret copied")}
            >
              <Copy size={13} />
            </Button>
          </div>

          <Alert variant="warning" title="Save your backup codes">
            These codes are shown only once. Store them in a password manager or
            print them. You will need them if you lose your phone.
          </Alert>

          <div className="c360-2fa-backup-grid">
            {setupData.backupCodes.map((c) => (
              <code key={c} className="c360-2fa-code">
                {c}
              </code>
            ))}
          </div>

          <div className="c360-badge-row">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              leftIcon={<Download size={14} />}
              onClick={() =>
                downloadCodesFile(
                  setupData.backupCodes,
                  "contact360-backup-codes.txt",
                )
              }
            >
              Download .txt
            </Button>
          </div>

          <Checkbox
            checked={savedCodesAck}
            onChange={setSavedCodesAck}
            label="I saved my backup codes in a safe place"
          />

          <Input
            label={`${TOTP_CODE_LENGTH}-digit code from your authenticator app`}
            value={otpCode}
            onChange={(e) => {
              setOtpCode(
                e.target.value.replace(/\D/g, "").slice(0, TOTP_CODE_LENGTH),
              );
              setOtpError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && void handleVerify()}
            placeholder={Array(TOTP_CODE_LENGTH).fill("0").join("")}
            maxLength={TOTP_CODE_LENGTH}
            inputMode="numeric"
          />
          {otpError && <p className="c360-otp-error">{otpError}</p>}

          <Button
            loading={working}
            type="button"
            onClick={() => void handleVerify()}
          >
            Verify &amp; activate
          </Button>
        </div>
      )}

      {enabled && (
        <div className="c360-2fa-setup-section">
          <div className="c360-2fa-status-row">
            <ShieldCheck size={20} className="c360-text-success" />
            <p className="c360-2fa-status-text">
              Two-factor authentication is active on your account.
            </p>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw size={14} />}
              loading={working}
              type="button"
              onClick={() => void handleRegenerate()}
            >
              Regenerate codes
            </Button>
          </div>

          {regenCodes.length > 0 && (
            <div className="c360-2fa-backup-box">
              <p className="c360-section-label">New backup codes</p>
              <Alert variant="warning" title="Shown once">
                Previous backup codes no longer work. Save these new codes now.
              </Alert>
              <div className="c360-2fa-backup-grid">
                {regenCodes.map((code) => (
                  <code key={code} className="c360-2fa-code">
                    {code}
                  </code>
                ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                leftIcon={<Download size={14} />}
                onClick={() =>
                  downloadCodesFile(
                    regenCodes,
                    "contact360-backup-codes-new.txt",
                  )
                }
              >
                Download .txt
              </Button>
            </div>
          )}

          <div className="c360-2fa-disable-section">
            <p className="c360-page-subtitle c360-mb-2">
              Disable 2FA — enter your password or a backup code (per API).
            </p>
            <div className="c360-section-stack c360-max-w-400">
              <Input
                type="password"
                label="Password (optional)"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
              />
              <Input
                label="Backup code (optional)"
                value={disableBackupCode}
                onChange={(e) => setDisableBackupCode(e.target.value)}
                placeholder="One of your one-time backup codes"
              />
            </div>
            <div className="c360-badge-row c360-mt-2">
              <Button
                variant="danger"
                size="sm"
                leftIcon={<ShieldOff size={14} />}
                loading={working}
                type="button"
                onClick={() => void handleDisable()}
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

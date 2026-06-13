"use client";

import { Modal } from "@/components/ui/Modal";
import {
  EmailOtpPinInput,
  type EmailOtpPinInputProps,
} from "@/components/feature/auth/EmailOtpPinInput";

export type EmailOtpPurpose = "registration" | "login";

export interface EmailOtpModalProps extends Omit<
  EmailOtpPinInputProps,
  "showIntro" | "resetKey" | "showSubmitButton"
> {
  isOpen: boolean;
  email: string;
  purpose: EmailOtpPurpose;
  onClose?: () => void;
  submitLabel?: string;
}

export function EmailOtpModal({
  isOpen,
  email,
  purpose,
  loading = false,
  error,
  onVerify,
  onResend,
  onClose,
  submitLabel,
}: EmailOtpModalProps) {
  const title =
    purpose === "login" ? "Enter sign-in code" : "Verify your email";

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose ?? (() => undefined)}
      title={title}
      size="sm"
      closeOnOverlay={false}
    >
      <EmailOtpPinInput
        email={email}
        purpose={purpose}
        loading={loading}
        error={error}
        onVerify={onVerify}
        onResend={onResend}
        resetKey={email}
        showSubmitButton
        submitLabel={submitLabel}
      />
    </Modal>
  );
}

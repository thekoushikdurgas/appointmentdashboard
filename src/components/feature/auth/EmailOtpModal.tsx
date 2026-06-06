"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PinInput } from "@ark-ui/react/pin-input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type EmailOtpPurpose = "registration" | "login";

export interface EmailOtpModalProps {
  isOpen: boolean;
  email: string;
  purpose: EmailOtpPurpose;
  loading?: boolean;
  error?: string | null;
  onVerify: (code: string) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  onClose?: () => void;
}

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SEC = 60;

export function EmailOtpModal({
  isOpen,
  email,
  purpose,
  loading = false,
  error,
  onVerify,
  onResend,
  onClose,
}: EmailOtpModalProps) {
  const [value, setValue] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const submittedRef = useRef<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setValue([]);
      submittedRef.current = null;
      return;
    }
    setCooldown(RESEND_COOLDOWN_SEC);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [isOpen, cooldown]);

  const handleComplete = useCallback(
    async (details: { value: string[] }) => {
      const code = details.value.join("");
      if (code.length !== OTP_LENGTH || loading) return;
      if (submittedRef.current === code) return;
      submittedRef.current = code;
      await onVerify(code);
    },
    [loading, onVerify],
  );

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    submittedRef.current = null;
    setValue([]);
    await onResend();
    setCooldown(RESEND_COOLDOWN_SEC);
  };

  const title =
    purpose === "login" ? "Enter sign-in code" : "Verify your email";

  const intro =
    purpose === "login"
      ? "We sent a 4-digit code to"
      : "Enter the 4-digit code we sent to";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose ?? (() => undefined)}
      title={title}
      size="sm"
      closeOnOverlay={false}
      initialFocusRef={firstInputRef}
      footer={
        <Button
          type="button"
          className="c360-w-full"
          loading={loading}
          disabled={value.join("").length !== OTP_LENGTH}
          onClick={() => handleComplete({ value })}
        >
          Verify
        </Button>
      }
    >
      <p className="c360-otp-modal__intro">
        {intro} <span className="c360-otp-modal__email">{email}</span>
      </p>

      <PinInput.Root
        value={value}
        onValueChange={(e) => setValue(e.value)}
        onValueComplete={handleComplete}
        otp
        type="numeric"
        placeholder=""
      >
        <PinInput.Control className="c360-otp-pin">
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <PinInput.Input
              key={i}
              index={i}
              ref={i === 0 ? firstInputRef : undefined}
              className="c360-otp-pin__input"
              inputMode="numeric"
              autoComplete={
                purpose === "login" ? "one-time-code" : "one-time-code"
              }
            />
          ))}
        </PinInput.Control>
        <PinInput.HiddenInput />
      </PinInput.Root>

      {error && (
        <div
          className="c360-alert c360-alert--error c360-otp-modal__error"
          role="alert"
        >
          <div className="c360-alert__body">{error}</div>
        </div>
      )}

      <div className="c360-otp-modal__resend">
        {cooldown > 0 ? (
          <span>Resend code in {cooldown}s</span>
        ) : (
          <button
            type="button"
            className="c360-auth-link-btn"
            onClick={handleResend}
            disabled={loading}
          >
            Resend code
          </button>
        )}
      </div>
    </Modal>
  );
}

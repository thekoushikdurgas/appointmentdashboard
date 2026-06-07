"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PinInput } from "@ark-ui/react/pin-input";

export interface EmailOtpPinInputProps {
  email?: string;
  purpose?: "registration" | "login";
  loading?: boolean;
  error?: string | null;
  onVerify: (code: string) => void | Promise<void>;
  onResend: () => void | Promise<void>;
  /** Reset pin cells when this key changes (e.g. new challenge). */
  resetKey?: string;
  showIntro?: boolean;
}

const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SEC = 60;

export function EmailOtpPinInput({
  email,
  purpose = "login",
  loading = false,
  error,
  onVerify,
  onResend,
  resetKey,
  showIntro = true,
}: EmailOtpPinInputProps) {
  const [value, setValue] = useState<string[]>([]);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const submittedRef = useRef<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue([]);
    submittedRef.current = null;
    setCooldown(RESEND_COOLDOWN_SEC);
  }, [resetKey]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown, resetKey]);

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

  const intro =
    purpose === "login"
      ? "Enter the 4-digit code we sent to"
      : "Enter the 4-digit code we sent to";

  return (
    <div className="c360-otp-pin-block">
      {showIntro && email && (
        <p className="c360-otp-pin-block__intro">
          {intro} <span className="c360-otp-modal__email">{email}</span>
        </p>
      )}

      <PinInput.Root
        value={value}
        onValueChange={(e) => setValue(e.value)}
        onValueComplete={handleComplete}
        otp
        type="numeric"
        placeholder=""
      >
        <PinInput.Label className="c360-sr-only">
          Verification code
        </PinInput.Label>
        <PinInput.Control className="c360-otp-pin">
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <PinInput.Input
              key={i}
              index={i}
              ref={i === 0 ? firstInputRef : undefined}
              className="c360-otp-pin__input"
              inputMode="numeric"
              autoComplete="one-time-code"
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
    </div>
  );
}

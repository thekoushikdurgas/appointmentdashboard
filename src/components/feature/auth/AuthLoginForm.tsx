"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import { EmailOtpPinInput } from "@/components/feature/auth/EmailOtpPinInput";
import type { AuthLoginFormState } from "@/hooks/useLoginForm";
import type { AuthOtpLoginFormHookState } from "@/hooks/useOtpLoginForm";

export type LoginMethod = "password" | "otp";

interface AuthLoginFormProps {
  form: AuthLoginFormState;
  otpForm: AuthOtpLoginFormHookState;
  loginMethod: LoginMethod;
  onSwitchToOtp: () => void;
  onSwitchToPassword: () => void;
  onSwitchToRegister: () => void;
  loginOtpActive: boolean;
  loginOtpEmail?: string;
  otpLoading?: boolean;
  otpError?: string | null;
  onVerifyOtp: (code: string) => void | Promise<void>;
  onResendOtp: () => void | Promise<void>;
}

export function AuthLoginForm({
  form,
  otpForm,
  loginMethod,
  onSwitchToOtp,
  onSwitchToPassword,
  onSwitchToRegister,
  loginOtpActive,
  loginOtpEmail,
  otpLoading = false,
  otpError,
  onVerifyOtp,
  onResendOtp,
}: AuthLoginFormProps) {
  const isPassword = loginMethod === "password";
  const loading = isPassword ? form.loading : otpForm.loading || otpLoading;
  const error = isPassword ? form.error : otpForm.error || otpError;

  const handleSubmit = (e: React.FormEvent) => {
    if (isPassword) {
      form.submit(e);
      return;
    }
    if (loginOtpActive) {
      e.preventDefault();
      return;
    }
    otpForm.submit(e);
  };

  const emailValue = isPassword ? form.email : otpForm.email;
  const setEmail = isPassword ? form.setEmail : otpForm.setEmail;
  const emailFieldError = isPassword
    ? form.fieldError("email")
    : otpForm.fieldError("email");

  return (
    <form className="c360-auth-form" onSubmit={handleSubmit} noValidate>
      {loading && (
        <div className="c360-auth-form__progress" aria-hidden>
          <Progress indeterminate size="sm" color="primary" />
        </div>
      )}

      {error && (
        <div
          className="c360-alert c360-alert--error"
          role="alert"
          aria-live="polite"
        >
          <div className="c360-alert__body">{error}</div>
        </div>
      )}

      <Input
        type="email"
        label="Email"
        placeholder="you@company.com"
        value={emailValue}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        leftIcon={<Mail size={16} />}
        autoFocus
        error={emailFieldError}
      />

      {isPassword ? (
        <>
          <div className="c360-field">
            <div className="c360-auth-field-header">
              <label className="c360-label c360-label--required">
                Password
              </label>
              <button
                type="button"
                className="c360-auth-link-btn c360-auth-field-header__action"
                onClick={onSwitchToOtp}
              >
                Sign in with email code
              </button>
            </div>
            <div className="c360-input-wrap" suppressHydrationWarning>
              <span className="c360-input__affix c360-input__affix--left">
                <Lock size={16} />
              </span>
              <input
                type={form.showPassword ? "text" : "password"}
                className={`c360-input c360-search__input${form.fieldError("password") ? " c360-input--error" : ""}`}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => form.setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-invalid={!!form.fieldError("password")}
              />
              <span className="c360-input__affix c360-input__affix--right">
                <button
                  type="button"
                  className="c360-auth-pw-toggle"
                  onClick={() => form.setShowPassword(!form.showPassword)}
                  aria-label={
                    form.showPassword ? "Hide password" : "Show password"
                  }
                >
                  {form.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </div>
            {form.fieldError("password") && (
              <span className="c360-error-text" role="alert">
                {form.fieldError("password")}
              </span>
            )}
          </div>

          <div className="c360-auth-form__row--split" suppressHydrationWarning>
            <div className="c360-auth-form__remember" suppressHydrationWarning>
              <Checkbox
                checked={form.rememberBrowser}
                onChange={(v) => form.setRememberBrowser(v)}
                label="Stay signed in on this browser"
                description="When enabled, sends timezone and device info with sign-in for server audit."
                size="sm"
              />
            </div>
            <Link
              href="/forgot-password"
              className="c360-link c360-auth-forgot-link"
            >
              Forgot password?
            </Link>
          </div>
        </>
      ) : (
        <div className="c360-field">
          <div className="c360-auth-field-header">
            <span className="c360-label">
              {loginOtpActive ? "Verification code" : "Email sign-in code"}
            </span>
            <button
              type="button"
              className="c360-auth-link-btn c360-auth-field-header__action"
              onClick={onSwitchToPassword}
            >
              Use password
            </button>
          </div>

          {loginOtpActive && loginOtpEmail ? (
            <EmailOtpPinInput
              email={loginOtpEmail}
              purpose="login"
              loading={otpLoading}
              error={otpError}
              onVerify={onVerifyOtp}
              onResend={onResendOtp}
              resetKey={loginOtpEmail}
              showIntro={false}
            />
          ) : (
            <p className="c360-auth-otp-hint">
              We&apos;ll send a 4-digit code to your email. Click below to
              receive it.
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={!isPassword && loginOtpActive}
        className="c360-w-full"
      >
        {isPassword
          ? "Sign in"
          : loginOtpActive
            ? "Code sent — enter above"
            : "Send sign-in code"}
      </Button>

      <p className="c360-auth-footer">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          className="c360-auth-link-btn"
          onClick={onSwitchToRegister}
        >
          Create one
        </button>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Progress } from "@/components/ui/Progress";
import type { AuthLoginFormState } from "@/hooks/useLoginForm";

interface AuthLoginFormProps {
  form: AuthLoginFormState;
  onSwitchToRegister: () => void;
}

export function AuthLoginForm({
  form,
  onSwitchToRegister,
}: AuthLoginFormProps) {
  return (
    <form className="c360-auth-form" onSubmit={form.submit} noValidate>
      {form.loading && (
        <div className="c360-auth-form__progress" aria-hidden>
          <Progress indeterminate size="sm" color="primary" />
        </div>
      )}

      {form.error && (
        <div
          className="c360-alert c360-alert--error"
          role="alert"
          aria-live="polite"
        >
          <div className="c360-alert__body">{form.error}</div>
        </div>
      )}

      <Input
        type="email"
        label="Email"
        placeholder="you@company.com"
        value={form.email}
        onChange={(e) => form.setEmail(e.target.value)}
        required
        autoComplete="email"
        leftIcon={<Mail size={16} />}
        autoFocus
        error={form.fieldError("email")}
      />

      <Input
        type={form.showPassword ? "text" : "password"}
        label="Password"
        placeholder="Enter your password"
        value={form.password}
        onChange={(e) => form.setPassword(e.target.value)}
        required
        autoComplete="current-password"
        leftIcon={<Lock size={16} />}
        error={form.fieldError("password")}
        rightIcon={
          <button
            type="button"
            className="c360-auth-pw-toggle"
            onClick={() => form.setShowPassword(!form.showPassword)}
            aria-label={form.showPassword ? "Hide password" : "Show password"}
          >
            {form.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

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

      <Button type="submit" loading={form.loading} className="c360-w-full">
        Sign in
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

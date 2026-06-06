"use client";

import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";

export interface AuthOtpLoginFormState {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  fieldError: (field: string) => string | undefined;
  submit: (e: React.FormEvent) => void;
}

interface AuthOtpLoginFormProps {
  form: AuthOtpLoginFormState;
  onSwitchToPassword: () => void;
}

export function AuthOtpLoginForm({
  form,
  onSwitchToPassword,
}: AuthOtpLoginFormProps) {
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

      <Button type="submit" loading={form.loading} className="c360-w-full">
        Send sign-in code
      </Button>

      <p className="c360-auth-footer">
        Prefer password?{" "}
        <button
          type="button"
          className="c360-auth-link-btn"
          onClick={onSwitchToPassword}
        >
          Sign in with password
        </button>
      </p>
    </form>
  );
}

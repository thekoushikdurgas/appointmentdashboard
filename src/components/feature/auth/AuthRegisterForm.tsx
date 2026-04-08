"use client";

import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import type { AuthRegisterFormState } from "@/hooks/useRegisterForm";

interface AuthRegisterFormProps {
  form: AuthRegisterFormState;
  onSwitchToLogin: () => void;
}

export function AuthRegisterForm({
  form,
  onSwitchToLogin,
}: AuthRegisterFormProps) {
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
        type="text"
        label="Full Name"
        placeholder="Jane Smith"
        value={form.name}
        onChange={(e) => form.setName(e.target.value)}
        required
        autoComplete="name"
        leftIcon={<User size={16} />}
        autoFocus
        error={form.fieldError("name")}
      />

      <Input
        type="email"
        label="Email"
        placeholder="you@company.com"
        value={form.email}
        onChange={(e) => form.setEmail(e.target.value)}
        required
        autoComplete="email"
        leftIcon={<Mail size={16} />}
        error={form.fieldError("email")}
      />

      <Input
        type={form.showPassword ? "text" : "password"}
        label="Password"
        placeholder="At least 8 characters"
        value={form.password}
        onChange={(e) => form.setPassword(e.target.value)}
        required
        autoComplete="new-password"
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

      <Input
        type={form.showPassword ? "text" : "password"}
        label="Confirm Password"
        placeholder="Repeat your password"
        value={form.confirm}
        onChange={(e) => form.setConfirm(e.target.value)}
        required
        autoComplete="new-password"
        leftIcon={<Lock size={16} />}
      />

      <Button type="submit" loading={form.loading} className="c360-w-full">
        Create Account
      </Button>

      <p className="c360-auth-footer">
        Already have an account?{" "}
        <button
          type="button"
          className="c360-auth-link-btn"
          onClick={onSwitchToLogin}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/graphql/authService";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token || !email) {
    return (
      <div className="c360-auth-card c360-text-center">
        <p className="c360-text-danger c360-mb-4">
          Invalid or missing reset link. Please request a new one.
        </p>
        <Link href="/forgot-password" className="c360-btn c360-btn--primary">
          Request reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(email, token, password);
      setDone(true);
      setTimeout(() => void router.push("/login"), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to reset password. The link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="c360-auth-card c360-text-center">
        <div className="c360-auth-success-icon-wrap">
          <CheckCircle size={32} className="c360-text-success" />
        </div>
        <h1 className="c360-auth-title c360-mb-2">Password updated</h1>
        <p className="c360-auth-subtitle c360-mb-6">
          Your password has been reset. Redirecting to sign in…
        </p>
        <Link href="/login" className="c360-auth-link-inline">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="c360-auth-card">
      <div className="c360-auth-header-block">
        <div className="c360-auth-header-icon">
          <KeyRound size={24} />
        </div>
        <h1 className="c360-auth-title c360-mb-1">Set new password</h1>
        <p className="c360-auth-subtitle">
          Choose a strong password for <strong>{email}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="c360-auth-form-stack">
        {error && (
          <div className="c360-alert c360-alert--error" role="alert">
            <div className="c360-alert__body">{error}</div>
          </div>
        )}

        <Input
          type={showPassword ? "text" : "password"}
          label="New password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          rightIcon={
            <button
              type="button"
              className="c360-auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          autoFocus
        />

        <Input
          type={showPassword ? "text" : "password"}
          label="Confirm new password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading} className="c360-w-full">
          Reset password
        </Button>
      </form>

      <div className="c360-auth-footer-link-row">
        <Link
          href="/login"
          className="c360-auth-link-inline c360-auth-link-inline--muted"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

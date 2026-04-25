"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/graphql/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="c360-auth-card c360-text-center" suppressHydrationWarning>
        <div className="c360-auth-success-icon-wrap">
          <CheckCircle size={32} className="c360-text-success" />
        </div>
        <h1 className="c360-auth-title c360-mb-2">Check your inbox</h1>
        <p className="c360-auth-subtitle c360-mb-6">
          We&apos;ve sent a password reset link to <strong>{email}</strong>. It
          may take a few minutes to arrive.
        </p>
        <Button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          variant="secondary"
          className="c360-w-full c360-mb-3"
        >
          Try a different email
        </Button>
        <Link href="/login" className="c360-auth-link-row">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="c360-auth-card" suppressHydrationWarning>
      <div className="c360-auth-header-block">
        <div className="c360-auth-header-icon">
          <Mail size={24} />
        </div>
        <h1 className="c360-auth-title c360-mb-1">Forgot your password?</h1>
        <p className="c360-auth-subtitle">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="c360-auth-form-stack">
        {error && (
          <div className="c360-alert c360-alert--error" role="alert">
            <div className="c360-alert__body">{error}</div>
          </div>
        )}

        <Input
          type="email"
          label="Email address"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          leftIcon={<Mail size={16} />}
          autoFocus
        />

        <Button type="submit" loading={loading} className="c360-w-full">
          Send reset link
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

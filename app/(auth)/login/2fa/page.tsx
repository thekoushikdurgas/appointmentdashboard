"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function TwoFactorLoginPage() {
  const { twoFactorChallenge, completeTwoFactorLogin } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!twoFactorChallenge) {
      router.replace("/login");
    }
    inputRef.current?.focus();
  }, [twoFactorChallenge, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = code.replace(/\s/g, "");
    if (!trimmed || trimmed.length !== 6) {
      setError("Please enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    try {
      await completeTwoFactorLogin(trimmed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!twoFactorChallenge) return null;

  return (
    <div className="c360-auth-card" suppressHydrationWarning>
      <div className="c360-auth-header-block">
        <div className="c360-auth-header-icon">
          <ShieldCheck size={24} />
        </div>
        <h1 className="c360-auth-title c360-mb-1">Two-factor authentication</h1>
        <p className="c360-auth-subtitle">
          Enter the 6-digit code from your authenticator app for{" "}
          <strong>{twoFactorChallenge.email}</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="c360-auth-form-stack">
        {error && (
          <div className="c360-alert c360-alert--error" role="alert">
            <div className="c360-alert__body">{error}</div>
          </div>
        )}

        <div className="c360-field">
          <label className="c360-label" htmlFor="2fa-code">
            Verification code
          </label>
          <input
            id="2fa-code"
            ref={inputRef}
            className="c360-input c360-input--xl c360-auth-2fa-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
            }
            required
          />
        </div>

        <Button type="submit" loading={loading} className="c360-w-full">
          Verify
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

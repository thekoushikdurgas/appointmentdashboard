"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";

export default function LockScreenPage() {
  const { user, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Please enter your password to continue.");
      return;
    }
    setLoading(true);
    try {
      /* Unlock is a UX placeholder until the API exposes password re-verification;
       * users should use full logout + login for strict re-auth. */
      await new Promise((r) => setTimeout(r, 800));
      // On success the middleware/AuthContext should clear the suspicious flag
      window.location.href = "/dashboard";
    } catch {
      setError("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="c360-auth-card" suppressHydrationWarning>
      <div className="c360-mb-6 c360-text-center">
        <div className="c360-auth-warning-icon-wrap">
          <ShieldAlert size={32} className="c360-text-warning" />
        </div>
        <h1 className="c360-auth-title c360-mb-1">Session locked</h1>
        <p className="c360-auth-subtitle c360-auth-subtitle--narrow">
          Suspicious activity was detected on your account. Please verify your
          identity to continue.
        </p>
        <p className="c360-text-xs c360-text-muted c360-max-w-sm c360-mt-3 c360-mx-auto c360-leading-relaxed">
          For strict re-authentication, sign out and log in again. Server-side
          password re-check is not wired yet.
        </p>
      </div>

      {user && (
        <div className="c360-lock-user-row">
          <div className="c360-lock-user-avatar">
            {(user.full_name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
          <div>
            <div className="c360-lock-user-name">
              {user.full_name ?? user.email}
            </div>
            <div className="c360-lock-user-email">{user.email}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleUnlock} noValidate className="c360-auth-form-stack">
        {error && (
          <div className="c360-alert c360-alert--error" role="alert">
            <div className="c360-alert__body">{error}</div>
          </div>
        )}

        <Input
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              className="c360-auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          autoFocus
        />

        <Button type="submit" loading={loading} className="c360-w-full">
          Unlock
        </Button>
      </form>

      <div className="c360-text-center c360-mt-4">
        <button
          type="button"
          className="c360-auth-text-link"
          onClick={() => logout()}
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}

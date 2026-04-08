"use client";

export function AuthLoginFallback() {
  return (
    <div className="c360-auth-card" aria-busy="true">
      <div className="c360-auth-fallback__brand">
        <div className="c360-auth-fallback__logo" />
        <div className="c360-spinner c360-auth-fallback__spinner" />
        <p className="c360-auth-fallback__text">Loading…</p>
      </div>
    </div>
  );
}

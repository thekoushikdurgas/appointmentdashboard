"use client";

interface AuthBrandHeaderProps {
  subtitle: string;
}

export function AuthBrandHeader({ subtitle }: AuthBrandHeaderProps) {
  return (
    <div className="c360-auth-shell__brand">
      <div className="c360-auth-shell__logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
          <path
            d="M7 14h14M7 9h9M7 19h11"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h1 className="c360-auth-shell__title">Contact360</h1>
      <p className="c360-auth-shell__subtitle">{subtitle}</p>
    </div>
  );
}

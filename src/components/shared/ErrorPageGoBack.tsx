"use client";

export function ErrorPageGoBack({ label = "Go back" }: { label?: string }) {
  return (
    <button
      type="button"
      className="c360-btn c360-btn--secondary c360-error-page__link-btn"
      onClick={() => history.back()}
    >
      {label}
    </button>
  );
}

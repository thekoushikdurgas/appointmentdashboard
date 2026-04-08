import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="c360-error-page">
      <div className="c360-error-page__icon-box-lg">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--c360-danger)"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      </div>
      <div>
        <h1 className="c360-error-page__title c360-error-page__title--semibold">
          Access Denied
        </h1>
        <p className="c360-error-page__text c360-mx-auto">
          You don&apos;t have permission to access this page. Contact your
          administrator if you think this is a mistake.
        </p>
      </div>
      <div className="c360-error-page__actions">
        <Link
          href="/dashboard"
          className="c360-btn c360-btn--primary c360-error-page__link-btn"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/login"
          className="c360-btn c360-btn--secondary c360-error-page__link-btn"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function InternalServerErrorPage() {
  return (
    <div className="c360-error-page">
      <div className="c360-error-page__icon-box-lg c360-error-page__icon-box-lg--spaced">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--c360-danger)"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="c360-error-page__watermark c360-error-page__watermark--danger-lg">
        500
      </div>
      <div>
        <h1 className="c360-error-page__title c360-error-page__title--semibold">
          Internal Server Error
        </h1>
        <p className="c360-error-page__text c360-mx-auto">
          Something went wrong on our end. Our team has been notified and is
          working to fix the issue. Please try again later.
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
          href="/status"
          className="c360-btn c360-btn--secondary c360-error-page__link-btn"
        >
          Check status
        </Link>
      </div>
    </div>
  );
}

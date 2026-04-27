import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function ServiceUnavailablePage() {
  return (
    <div className="c360-error-page">
      <div className="c360-error-page__icon-box-warning">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--c360-warning)"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
      </div>
      <div className="c360-error-page__watermark c360-error-page__watermark--warning">
        503
      </div>
      <div>
        <h1 className="c360-error-page__title c360-error-page__title--semibold">
          Service Unavailable
        </h1>
        <p className="c360-error-page__text c360-mx-auto">
          The service is temporarily unavailable due to maintenance or high
          load. Please try again in a few minutes.
        </p>
      </div>
      <div className="c360-error-page__actions">
        <Link
          href={ROUTES.DASHBOARD}
          className="c360-btn c360-btn--primary c360-error-page__link-btn"
        >
          Try Dashboard
        </Link>
        <Link
          href={ROUTES.HOME}
          className="c360-btn c360-btn--secondary c360-error-page__link-btn"
        >
          Go to home
        </Link>
      </div>
    </div>
  );
}

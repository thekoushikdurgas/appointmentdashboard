import Link from "next/link";

export default function BadRequestPage() {
  return (
    <div className="c360-error-page">
      <div className="c360-error-page__watermark c360-error-page__watermark--warning">
        400
      </div>
      <div>
        <h1 className="c360-error-page__title c360-error-page__title--semibold">
          Bad Request
        </h1>
        <p className="c360-error-page__text c360-mx-auto">
          The request could not be understood by the server due to malformed
          syntax. Please check your input and try again.
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

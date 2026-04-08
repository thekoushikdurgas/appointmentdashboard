import Link from "next/link";
import { ErrorPageGoBack } from "@/components/shared/ErrorPageGoBack";

export default function NotFoundPage() {
  return (
    <div className="c360-error-page">
      <div className="c360-error-page__watermark c360-error-page__watermark--primary-lg">
        404
      </div>
      <div>
        <h1 className="c360-error-page__title c360-error-page__title--semibold">
          Page Not Found
        </h1>
        <p className="c360-error-page__text c360-mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or navigate back to the dashboard.
        </p>
      </div>
      <div className="c360-error-page__actions">
        <Link
          href="/dashboard"
          className="c360-btn c360-btn--primary c360-error-page__link-btn"
        >
          Go to Dashboard
        </Link>
        <ErrorPageGoBack />
      </div>
    </div>
  );
}

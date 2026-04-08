import Link from "next/link";
import { Home, Search } from "lucide-react";
import { ErrorPageGoBack } from "@/components/shared/ErrorPageGoBack";

export default function NotFound() {
  return (
    <div className="c360-error-page">
      <div className="c360-error-page__watermark c360-error-page__watermark--primary">
        404
      </div>

      <div className="c360-error-page__icon-ring c360-error-page__icon-ring--primary">
        <Search size={28} />
      </div>

      <div>
        <h1 className="c360-error-page__title">Page not found</h1>
        <p className="c360-error-page__text c360-mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved. Double-check the URL or return to the dashboard.
        </p>
      </div>

      <div className="c360-error-page__actions">
        <Link
          href="/dashboard"
          className="c360-btn c360-btn--primary c360-error-page__link-btn"
        >
          <Home size={15} />
          Back to Dashboard
        </Link>
        <ErrorPageGoBack />
      </div>
    </div>
  );
}

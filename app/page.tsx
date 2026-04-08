import { redirect } from "next/navigation";

/**
 * Fallback when middleware does not run (e.g. certain static export edges).
 * Auth tokens live in localStorage only — not readable on the server — so we
 * always send the browser to /login; useAuthRedirect on that page sends
 * authenticated users to /dashboard.
 */
export default function RootPage() {
  redirect("/login");
}

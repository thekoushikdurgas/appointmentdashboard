"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /register now redirects to /login?tab=register so both auth flows
 * live in the same tabbed UI.
 */
export default function RegisterRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login?tab=register");
  }, [router]);

  return null;
}

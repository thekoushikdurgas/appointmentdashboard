"use client";

import { useRole } from "@/context/RoleContext";
import { DatabaseModuleComingSoon } from "@/components/feature/database/DatabaseModuleComingSoon";

export default function CompaniesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = useRole();

  if (!isAdmin) {
    return <DatabaseModuleComingSoon module="companies" />;
  }

  return <>{children}</>;
}

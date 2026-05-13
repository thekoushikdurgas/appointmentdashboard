"use client";

import { useRole } from "@/context/RoleContext";
import { DatabaseModuleComingSoon } from "@/components/feature/database/DatabaseModuleComingSoon";

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = useRole();

  if (!isAdmin) {
    return <DatabaseModuleComingSoon module="contacts" />;
  }

  return <>{children}</>;
}

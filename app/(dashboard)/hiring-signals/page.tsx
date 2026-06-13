import { Suspense } from "react";
import HiringSignalsPageClient from "@/components/feature/hiring-signals/HiringSignalsPageClient";
import { ShellSuspenseFallback } from "@/components/shared/ShellSuspenseFallback";

export default function HiringSignalsPage() {
  return (
    <Suspense fallback={<ShellSuspenseFallback />}>
      <HiringSignalsPageClient />
    </Suspense>
  );
}

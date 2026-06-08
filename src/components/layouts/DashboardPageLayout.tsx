import { cn } from "@/lib/utils";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
  className?: string;
  "data-tour"?: string;
}

export default function DashboardPageLayout({
  children,
  className,
  "data-tour": dataTour,
}: DashboardPageLayoutProps) {
  return (
    <div
      className={cn("c360-page", "c360-dashboard-layout", className)}
      data-tour={dataTour}
    >
      {children}
    </div>
  );
}

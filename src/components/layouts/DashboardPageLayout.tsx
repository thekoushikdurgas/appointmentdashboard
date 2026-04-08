import { cn } from "@/lib/utils";

interface DashboardPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function DashboardPageLayout({
  children,
  className,
}: DashboardPageLayoutProps) {
  return (
    <div className={cn("c360-page", "c360-dashboard-layout", className)}>
      {children}
    </div>
  );
}

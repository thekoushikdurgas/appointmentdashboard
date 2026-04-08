import { cn } from "@/lib/utils";

interface DataPageLayoutProps {
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  showFilters?: boolean;
}

export default function DataPageLayout({
  filters,
  children,
  className,
  showFilters = true,
}: DataPageLayoutProps) {
  if (!showFilters || !filters) {
    return <div className={cn("c360-page", className)}>{children}</div>;
  }

  return (
    <div className="c360-page">
      <div className={cn("c360-data-layout", className)}>
        <aside className="c360-data-layout__filters">{filters}</aside>
        <div className="c360-data-layout__content">{children}</div>
      </div>
    </div>
  );
}

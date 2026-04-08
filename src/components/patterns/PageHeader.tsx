import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("c360-page-header", className)}>
      <div>
        <h1 className="c360-page-header__title">{title}</h1>
        {subtitle && <p className="c360-page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="c360-page-header__actions">{actions}</div>}
    </div>
  );
}

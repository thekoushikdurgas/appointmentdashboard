import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title?: string;
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
  const hasText = Boolean(title || subtitle);
  return (
    <div
      className={cn(
        "c360-page-header",
        !hasText && actions && "c360-page-header--actions-only",
        className,
      )}
    >
      {hasText ? (
        <div>
          {title ? <h1 className="c360-page-header__title">{title}</h1> : null}
          {subtitle ? (
            <p className="c360-page-header__subtitle">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      {actions ? (
        <div className="c360-page-header__actions">{actions}</div>
      ) : null}
    </div>
  );
}

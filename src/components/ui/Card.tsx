"use client";

import { cn } from "@/lib/utils";

type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: CardPadding;
}

function Card({
  title,
  subtitle,
  actions,
  footer,
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  const hasHeader = title || actions;

  return (
    <div className={cn("c360-card", className)} {...props}>
      {hasHeader && (
        <div className="c360-card__header">
          <div>
            {title &&
              (typeof title === "string" ? (
                <h3 className="c360-card__title">{title}</h3>
              ) : (
                title
              ))}
            {subtitle &&
              (typeof subtitle === "string" ? (
                <p className="c360-card__subtitle">{subtitle}</p>
              ) : (
                subtitle
              ))}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children !== undefined && (
        <div className={cn("c360-card__body", `c360-card__body--${padding}`)}>
          {children}
        </div>
      )}
      {footer && <div className="c360-card__footer">{footer}</div>}
    </div>
  );
}

export { Card };
export default Card;

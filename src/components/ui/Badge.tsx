import { cn } from "@/lib/utils";

type BadgeBaseColor =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "gray"
  | "indigo"
  | "emerald"
  | "yellow";

export type BadgeColor =
  | BadgeBaseColor
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "info";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  dot?: boolean;
  size?: BadgeSize;
}

const COLOR_MAP: Record<BadgeColor, BadgeBaseColor> = {
  primary: "blue",
  secondary: "gray",
  success: "green",
  warning: "orange",
  danger: "red",
  accent: "purple",
  info: "indigo",
  blue: "blue",
  green: "green",
  orange: "orange",
  red: "red",
  purple: "purple",
  gray: "gray",
  indigo: "indigo",
  emerald: "emerald",
  yellow: "yellow",
};

function Badge({
  color = "primary",
  dot = false,
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  const resolved = COLOR_MAP[color];

  return (
    <span
      className={cn(
        "c360-badge",
        `c360-badge--${resolved}`,
        size !== "md" && `c360-badge--${size}`,
        className,
      )}
      {...props}
    >
      {dot && <span className="c360-badge__dot" aria-hidden />}
      {children}
    </span>
  );
}

export { Badge };
export default Badge;

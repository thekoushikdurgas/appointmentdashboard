import { ReactNode, HTMLAttributes } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Alert colour variants mapped to c360 design tokens.
 * "error" is an alias for "danger" so callers can use either spelling.
 */
export type AlertVariant = "success" | "warning" | "danger" | "error" | "info";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

const ICON_MAP: Record<AlertVariant, ReactNode> = {
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  danger: <XCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
};

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className,
  ...rest
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(`c360-alert c360-alert--${variant}`, className)}
      {...rest}
    >
      <span className="c360-alert__icon">{ICON_MAP[variant]}</span>
      <div className="c360-alert__body">
        {title && <div className="c360-alert__title">{title}</div>}
        <div className="c360-alert__message">{children}</div>
      </div>
      {onClose && (
        <button
          className="c360-alert__close"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

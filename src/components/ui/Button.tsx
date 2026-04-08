"use client";

import { Children, cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      leftIcon,
      rightIcon,
      asChild = false,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "c360-btn",
      `c360-btn--${variant}`,
      size !== "md" && `c360-btn--${size}`,
      loading && "c360-btn--loading",
      className,
    );

    if (asChild) {
      const child = Children.only(children);
      if (!isValidElement(child)) {
        throw new Error(
          "Button with asChild expects a single React element child.",
        );
      }
      const { className: childClassName } = child.props as {
        className?: string;
      };
      return cloneElement(child, {
        className: cn(classes, childClassName),
        ref,
      } as never);
    }

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <span className="c360-btn__spinner" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
export default Button;

"use client";

import { ReactNode } from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  /** Optional message string; ignored if children are provided */
  message?: string;
  /** Optional custom body; takes precedence over `message` */
  children?: ReactNode;
  /** Primary button label (fallback for legacy `confirmText`) */
  confirmLabel?: string;
  /** Legacy alias for `confirmLabel` */
  confirmText?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /** Loading state (fallback for legacy `isLoading`) */
  processing?: boolean;
  /** Legacy alias for `processing` */
  isLoading?: boolean;
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: React.ReactNode;
    btnVariant: "danger" | "primary" | "secondary";
  }
> = {
  danger: {
    icon: <Trash2 size={24} />,
    btnVariant: "danger",
  },
  warning: {
    icon: <AlertTriangle size={24} />,
    btnVariant: "primary",
  },
  info: {
    icon: <Info size={24} />,
    btnVariant: "primary",
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  children,
  confirmLabel,
  confirmText,
  cancelLabel = "Cancel",
  variant = "danger",
  processing,
  isLoading,
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];
  const loading = processing ?? isLoading ?? false;
  const finalConfirmLabel = confirmLabel ?? confirmText ?? "Confirm";
  const body = children ?? message;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={cfg.btnVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {finalConfirmLabel}
          </Button>
        </>
      }
    >
      <div className="c360-confirm-modal">
        <div
          className={cn(
            "c360-confirm-modal__icon",
            `c360-confirm-modal__icon--${variant}`,
          )}
        >
          {cfg.icon}
        </div>
        <h3 className="c360-confirm-modal__title">{title}</h3>
        {body && <p className="c360-confirm-modal__message">{body}</p>}
      </div>
    </Modal>
  );
}

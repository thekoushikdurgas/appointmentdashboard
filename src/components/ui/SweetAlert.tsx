"use client";

import { useEffect, useState, useRef, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { useOverlayLayer } from "@/hooks/useOverlayLayer";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export type SweetAlertType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "confirm";

export interface SweetAlertOptions {
  type?: SweetAlertType;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  autoClose?: number;
}

interface SweetAlertProps extends SweetAlertOptions {
  isOpen: boolean;
  onClose: () => void;
}

const ICONS: Record<SweetAlertType, React.ReactNode> = {
  success: <CheckCircle size={48} />,
  error: <XCircle size={48} />,
  warning: <AlertTriangle size={48} />,
  info: <Info size={48} />,
  confirm: <AlertTriangle size={48} />,
};

export function SweetAlert({
  isOpen,
  onClose,
  type = "info",
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  autoClose,
}: SweetAlertProps) {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose();
  }, [onCancel, onClose]);

  const layerActive = isOpen && mounted;
  useOverlayLayer(layerActive, onClose, dialogRef, { onEscape: handleCancel });

  useEffect(() => {
    if (!layerActive || !autoClose) return;
    const t = setTimeout(onClose, autoClose);
    return () => clearTimeout(t);
  }, [layerActive, autoClose, onClose]);

  if (!isOpen || !mounted) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      setConfirmLoading(true);
      try {
        await onConfirm();
      } finally {
        setConfirmLoading(false);
      }
    }
    onClose();
  };

  return createPortal(
    <div
      className="c360-sweet-alert__backdrop"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        ref={dialogRef}
        className="c360-sweet-alert__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <button
          type="button"
          onClick={handleCancel}
          className="c360-sweet-alert__close"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div
          className={cn(
            "c360-sweet-alert__icon",
            `c360-sweet-alert__icon--${type}`,
          )}
        >
          {ICONS[type]}
        </div>

        <h3 id={titleId} className="c360-sweet-alert__title">
          {title}
        </h3>

        {message && <p className="c360-sweet-alert__message">{message}</p>}

        <div className="c360-sweet-alert__actions">
          {type === "confirm" && (
            <Button variant="secondary" onClick={handleCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={
              type === "error"
                ? "danger"
                : type === "confirm"
                  ? "danger"
                  : "primary"
            }
            loading={confirmLoading}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Hook to imperatively show sweet alerts.
 */
export function useSweetAlert() {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: SweetAlertOptions;
  }>({
    isOpen: false,
    options: { title: "" },
  });

  const show = (options: SweetAlertOptions) => {
    setState({ isOpen: true, options });
  };

  const hide = () => setState((s) => ({ ...s, isOpen: false }));

  return {
    show,
    hide,
    SweetAlertNode: (
      <SweetAlert isOpen={state.isOpen} onClose={hide} {...state.options} />
    ),
  };
}

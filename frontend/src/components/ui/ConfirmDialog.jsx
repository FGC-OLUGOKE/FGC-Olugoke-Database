import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import useEscapeKey from "../../hooks/useEscapeKey";
import Button from "./Button";

/**
 * ConfirmDialog
 *
 * Generic centered confirmation modal for destructive or important
 * actions (deleting a member, discarding unsaved changes, etc).
 * Portal-rendered so it always floats above everything — including
 * drawers, which sit at z-50; this renders at z-[60] to guarantee it
 * layers above a drawer if a destructive action is triggered from
 * inside one (e.g. Edit Member's future "discard changes" prompt).
 *
 * Closes on Escape or backdrop click. Defaults to a red "danger"
 * confirm button since destructive actions are the primary use case
 * — pass `confirmVariant="primary"` for a non-destructive confirm.
 *
 * Props:
 * - isOpen         (bool)
 * - title          (string)
 * - description    (string)
 * - confirmLabel   (string)  default "Delete"
 * - cancelLabel    (string)  default "Cancel"
 * - confirmVariant (string)  default "danger"
 * - onConfirm      (fn)
 * - onCancel       (fn)
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  loadingLabel = "Processing...",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = isLoading || isSubmitting;

  async function handleConfirm() {
    if (isBusy) return;
    setIsSubmitting(true);
    try {
      await onConfirm?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    document.body.style.overflow = "";
    const timeout = setTimeout(() => setShouldRender(false), 150);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEscapeKey(() => !isBusy && onCancel?.(), isOpen);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        onClick={!isBusy ? onCancel : undefined}
        aria-hidden="true"
        className={`absolute inset-0 bg-gray-900/40 transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className={`relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl transition-all duration-150 ease-out ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#9e263b]/10">
          <AlertTriangle className="h-5 w-5 text-[#9e263b]" strokeWidth={2} />
        </div>

        <h2 className="mt-4 text-base font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1.5 text-sm text-gray-500">{description}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} isLoading={isBusy} loadingLabel={loadingLabel}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useEscapeKey from "../../hooks/useEscapeKey";

/**
 * Drawer
 *
 * Generic right-side slide-over shell, portal-rendered to
 * document.body. Full-width on mobile (≤768px), fixed max-width
 * on desktop. Used by MemberDetailsDrawer and (later) MemberForm —
 * any drawer/slide-over in the app should be built on this so the
 * open/close animation and behavior never drifts between them.
 *
 * Behavior:
 * - Closes on backdrop click
 * - Closes on Escape
 * - Locks page scroll while open
 * - Slides in from the right with a subtle transition
 *
 * Props:
 * - isOpen     (bool)
 * - onClose    (fn)
 * - title      (string, optional) — header title; header is omitted if not passed
 * - widthClass (string) — desktop max-width, defaults to a comfortable reading width
 * - children   (node)
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  widthClass = "md:max-w-md",
  side = "right",
  children,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    document.body.style.overflow = "";
    const timeout = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEscapeKey(() => onClose?.(), isOpen);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-gray-900/40 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute top-0 flex h-full w-full flex-col bg-white shadow-xl transition-transform duration-200 ease-out ${
          side === "left" ? "left-0" : "right-0"
        } ${widthClass} ${
          visible
            ? "translate-x-0"
            : side === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
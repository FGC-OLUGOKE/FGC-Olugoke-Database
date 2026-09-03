import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import useEscapeKey from "../../hooks/useEscapeKey";

/**
 * Drawer
 *
 * Generic slide-over shell, portal-rendered to document.body. Used
 * by MemberDetailsDrawer, DepartmentForm, MobileNav, and MemberForm —
 * any drawer/slide-over/modal in the app should be built on this so
 * open/close animation and behavior never drifts between instances.
 *
 * Two layout modes:
 * - Default (desktopModal=false): a side drawer at every screen
 *   size — full-width on mobile, fixed max-width on desktop, slides
 *   in from `side`. This is unchanged existing behavior.
 * - desktopModal=true: still a full-width side drawer on mobile
 *   (≤768px — the "keep the drawer, it works well on small screens"
 *   case), but becomes a CENTERED modal at the md: breakpoint —
 *   fades/scales in instead of sliding, capped height with its own
 *   internal scroll, rounded corners, backdrop blur. Purely a `md:`
 *   breakpoint switch — no JS viewport detection needed.
 *
 * Behavior (both modes):
 * - Closes on backdrop click
 * - Closes on Escape (only if this is the topmost open overlay)
 * - Locks page scroll while open
 *
 * Props:
 * - isOpen       (bool)
 * - onClose      (fn)
 * - title        (string, optional) — header title; header omitted if not passed
 * - widthClass   (string) — max-width at desktop (used for both the
 *                 side-drawer max-width AND the centered-modal max-width)
 * - side         ("left" | "right") — mobile/default slide direction
 * - desktopModal (bool) — opt in to the centered-modal-on-desktop behavior
 * - children     (node)
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  widthClass = "md:max-w-md",
  side = "right",
  desktopModal = false,
  children,
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const previousOverflow = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => {
        cancelAnimationFrame(raf);
        document.body.style.overflow = previousOverflow.current ?? "";
        previousOverflow.current = null;
      };
    }
    setVisible(false);
    const timeout = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEscapeKey(() => onClose?.(), isOpen);

  if (!shouldRender) return null;

  const hiddenTranslate = side === "left" ? "-translate-x-full" : "translate-x-full";

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-gray-900/40 transition-opacity duration-200 ${
          desktopModal ? "md:backdrop-blur-sm" : ""
        } ${visible ? "opacity-100" : "opacity-0"}`}
      />

      {/* Alignment layer — stretches/right-aligns the panel on
          mobile (drawer); switches to centering it on desktop when
          desktopModal is set. */}
      <div
        className={`fixed inset-0 flex items-stretch ${
          side === "left" ? "justify-start" : "justify-end"
        } ${desktopModal ? "md:items-center md:justify-center md:p-4" : ""}`}
      >
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          className={`flex w-full flex-col bg-white shadow-xl transition-all duration-200 ease-out ${widthClass} ${
            visible ? "translate-x-0" : hiddenTranslate
          } ${
            desktopModal
              ? `h-full md:h-fit md:max-h-[85vh] md:translate-x-0 md:rounded-2xl ${
                  visible ? "md:scale-100 md:opacity-100" : "md:scale-95 md:opacity-0"
                }`
              : "h-full"
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
      </div>
    </div>,
    document.body
  );
}
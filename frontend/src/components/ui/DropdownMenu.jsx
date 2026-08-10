import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useClickOutside from "../../hooks/useClickOutside";
import useEscapeKey from "../../hooks/useEscapeKey";

const OPEN_EVENT = "dropdown-menu:open";
const MENU_WIDTH = 192; // px — matches the w-48 the menu renders at

/**
 * DropdownMenu
 *
 * A generic, portal-based dropdown. Renders its menu into
 * `document.body` so it's never clipped by a parent's overflow
 * (e.g. a table cell with `overflow-hidden`) and always floats
 * above the rest of the page.
 *
 * Behavior:
 * - Closes on outside click
 * - Closes on Escape
 * - Only one DropdownMenu can be open at a time, globally
 * - Right-aligns its menu to the trigger's right edge
 * - Repositions on scroll/resize while open
 *
 * Usage:
 *   <DropdownMenu trigger={<button>Manage ▾</button>}>
 *     {(close) => (
 *       <>
 *         <DropdownMenuItem label="View Profile" onClick={() => { ...; close(); }} />
 *       </>
 *     )}
 *   </DropdownMenu>
 */
export default function DropdownMenu({ trigger, children }) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  function updatePosition() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: rect.right + window.scrollX - MENU_WIDTH,
    });
  }

  function openMenu() {
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
    updatePosition();
    setIsOpen(true);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Mount immediately on open; delay unmount slightly so the
  // fade/scale-out transition can actually play.
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timeout = setTimeout(() => setShouldRender(false), 150);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // Only one dropdown open at a time, app-wide.
  useEffect(() => {
    function onOtherMenuOpen(event) {
      if (event.detail !== id) closeMenu();
    }
    window.addEventListener(OPEN_EVENT, onOtherMenuOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOtherMenuOpen);
  }, [id]);

  // Keep the menu anchored to its trigger while scrolling/resizing.
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useClickOutside(
    menuRef,
    (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      closeMenu();
    },
    isOpen
  );

  useEscapeKey(closeMenu, isOpen);

  return (
    <>
      <div ref={triggerRef} onClick={toggleMenu} className="inline-flex">
        {trigger}
      </div>

      {shouldRender &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              width: MENU_WIDTH,
            }}
            className={`z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg transition-all duration-150 ease-out ${
              visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            {children(closeMenu)}
          </div>,
          document.body
        )}
    </>
  );
}

export function DropdownMenuItem({ icon: Icon, label, onClick, variant = "default" }) {
  const isDanger = variant === "danger";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
        isDanger
          ? "text-[#9e263b] hover:bg-[#9e263b]/5"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
      {label}
    </button>
  );
}
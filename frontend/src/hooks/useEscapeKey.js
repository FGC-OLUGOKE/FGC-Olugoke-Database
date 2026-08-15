import { useEffect, useRef } from "react";

// Shared across every useEscapeKey instance in the app. Tracks which
// overlays (dropdowns, drawers, dialogs) currently have their Escape
// listener active, in the order they opened. Only the most recently
// opened one (the "topmost") actually responds to Escape — so e.g.
// opening a searchable dropdown inside a Drawer and pressing Escape
// closes just the dropdown first, not both at once.
let openStack = [];

/**
 * Calls `handler` when Escape is pressed, but ONLY if this is the
 * most-recently-opened active overlay. Pass `active=false` to
 * disable without unmounting the hook.
 */
export default function useEscapeKey(handler, active = true) {
  const idRef = useRef(Symbol("escape-listener"));

  useEffect(() => {
    if (!active) return;
    const id = idRef.current;
    openStack.push(id);
    return () => {
      openStack = openStack.filter((item) => item !== id);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function onKeyDown(event) {
      if (event.key !== "Escape") return;
      const isTopmost = openStack[openStack.length - 1] === idRef.current;
      if (!isTopmost) return;
      handler(event);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handler, active]);
}
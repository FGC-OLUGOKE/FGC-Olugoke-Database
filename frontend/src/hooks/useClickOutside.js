import { useEffect } from "react";

/**
 * Calls `handler` when a click/mousedown happens outside `ref`.
 * Pass `active=false` to disable the listener without unmounting
 * the hook (e.g. only listen while a menu/drawer is open).
 */
export default function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return;

    function onPointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        handler(event);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [ref, handler, active]);
}
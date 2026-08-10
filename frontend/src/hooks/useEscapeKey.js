import { useEffect } from "react";

/**
 * Calls `handler` when the Escape key is pressed.
 * Pass `active=false` to disable without unmounting the hook.
 */
export default function useEscapeKey(handler, active = true) {
  useEffect(() => {
    if (!active) return;

    function onKeyDown(event) {
      if (event.key === "Escape") handler(event);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handler, active]);
}
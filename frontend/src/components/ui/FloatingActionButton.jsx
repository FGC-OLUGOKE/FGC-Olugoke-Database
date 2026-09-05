import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

const BUTTON_SIZE = 56;
const EDGE_MARGIN = 16;
const TOP_MARGIN = 72;
const STORAGE_PREFIX = "fgc-mobile-fab:";

function getInitialPosition(storageKey) {
  if (typeof window === "undefined") return { side: "right", top: 160 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`));
    if (saved && (saved.side === "left" || saved.side === "right") && Number.isFinite(saved.top)) {
      return saved;
    }
  } catch {
    // Use the default position when saved state is unavailable.
  }
  return { side: "right", top: Math.max(TOP_MARGIN, window.innerHeight - 180) };
}

function clampTop(top) {
  if (typeof window === "undefined") return top;
  return Math.min(
    Math.max(TOP_MARGIN, top),
    Math.max(TOP_MARGIN, window.innerHeight - BUTTON_SIZE - EDGE_MARGIN),
  );
}

function clampHorizontalOffset(offset, side) {
  if (typeof window === "undefined") return offset;
  const available = Math.max(0, window.innerWidth - BUTTON_SIZE - EDGE_MARGIN * 2);
  return side === "left"
    ? Math.min(Math.max(0, offset), available)
    : Math.max(Math.min(0, offset), -available);
}

export default function FloatingActionButton({ onClick, label, storageKey }) {
  const [position, setPosition] = useState(() => getInitialPosition(storageKey));
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => ({ ...current, top: clampTop(current.top) }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, JSON.stringify(position));
  }, [position, storageKey]);

  function handlePointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTop: position.top,
      moved: false,
    };
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) drag.moved = true;
    if (!drag.moved) return;
    event.preventDefault();
    setPosition((current) => ({
      ...current,
      top: clampTop(drag.startTop + deltaY),
    }));
    setDragOffsetX(clampHorizontalOffset(deltaX, position.side));
  }

  function handlePointerUp(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      const side = event.clientX < window.innerWidth / 2 ? "left" : "right";
      setPosition((current) => ({ side, top: clampTop(current.top) }));
      setDragOffsetX(0);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    dragRef.current = null;
  }

  function handleClick() {
    if (suppressClickRef.current) return;
    onClick();
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      className="fixed z-[40] flex h-14 w-14 touch-none select-none items-center justify-center rounded-full bg-[#154d78] text-white shadow-lg transition-[left,right,top,transform] duration-200 hover:bg-[#123f61] active:scale-95 md:hidden"
      style={{
        top: position.top,
        left: position.side === "left" ? EDGE_MARGIN : "auto",
        right: position.side === "right" ? EDGE_MARGIN : "auto",
        transform: `translateX(${dragOffsetX}px)`,
      }}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 4000;

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600", // matches Badge's "success" tone
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-[#9e263b]", // brand red
  },
  info: {
    icon: Info,
    iconClass: "text-[#154d78]", // brand blue
  },
};

/**
 * ToastProvider
 *
 * Wrap the app in this once (in App.jsx). Any descendant can then
 * call `useToast()` to show a brief confirmation after a UI action
 * (saving a form, confirming a delete, etc). This is UI-only
 * feedback — it doesn't call an API or persist anything; it just
 * acknowledges that the interaction happened.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success("Member added");
 *   toast.error("Something went wrong");
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, variant = "success") => {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
    },
    [removeToast]
  );

  const value = {
    success: (message) => addToast(message, "success"),
    error: (message) => addToast(message, "error"),
    info: (message) => addToast(message, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const { icon: Icon, iconClass } = VARIANTS[toast.variant] ?? VARIANTS.info;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg transition-all duration-200 ease-out ${
        visible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconClass}`} strokeWidth={2} />
      <p className="flex-1 text-sm text-gray-700">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
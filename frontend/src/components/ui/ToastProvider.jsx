import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);
const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const styles = {
  success: "border-emerald-500/40 text-emerald-200",
  error: "border-red-500/40 text-red-200",
  info: "border-purple-500/40 text-purple-200",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);
  const notify = useCallback((message, type = "info", duration = 4500) => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items.slice(-3), { id, message, type: styles[type] ? type : "info" }]);
    if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
    return id;
  }, [dismiss]);
  useEffect(() => {
    const visible = new Set(toasts.map((item) => item.id));
    for (const [id, timer] of timers.current) {
      if (!visible.has(id)) { clearTimeout(timer); timers.current.delete(id); }
    }
  }, [toasts]);
  useEffect(() => () => { for (const timer of timers.current.values()) clearTimeout(timer); }, []);
  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div aria-label="Notifications" className="pointer-events-none fixed inset-x-3 top-20 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:w-[min(420px,calc(100vw-40px))]">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div key={toast.id} role={toast.type === "error" ? "alert" : "status"} className={`pointer-events-auto flex w-full min-w-0 items-start gap-3 rounded-xl border bg-[#171725] p-4 shadow-2xl ${styles[toast.type]}`}>
              <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 break-words text-sm">{toast.message}</p>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)} className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded hover:bg-white/10"><X size={17}/></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

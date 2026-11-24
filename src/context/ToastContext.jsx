import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: "Saved", visible: false });
  const timer = useRef(null);

  const showToast = useCallback((message) => {
    setToast({ message, visible: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 pointer-events-none ${
          toast.visible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
        }`}
      >
        <div className="px-4 py-2.5 rounded-xl bg-charcoal-900 text-white text-xs font-medium shadow-lg flex items-center gap-2 border border-gold-500/40">
          <span className="w-2 h-2 rounded-full bg-gold-400"></span>
          <span>{toast.message}</span>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

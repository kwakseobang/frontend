"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import styles from "./ToastProvider.module.css";

interface Toast {
  id: number;
  message: string;
}

interface ToastState {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastState | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const showToast = useCallback((message: string) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, message }]);
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
    timersRef.current.add(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.stack} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={styles.toast}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

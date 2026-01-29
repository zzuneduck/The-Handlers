import { createContext, useCallback, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  remove: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((m: string) => add('success', m), [add]);
  const error = useCallback((m: string) => add('error', m), [add]);
  const info = useCallback((m: string) => add('info', m), [add]);
  const warning = useCallback((m: string) => add('warning', m), [add]);

  return (
    <ToastContext.Provider value={{ toasts, success, error, info, warning, remove }}>
      {children}
    </ToastContext.Provider>
  );
}

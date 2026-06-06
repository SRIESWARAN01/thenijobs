'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ───────────────────────────── Types ─────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss in ms (default 4000). Set 0 to keep until dismissed. */
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

// ───────────────────────────── Context ─────────────────────────────

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastCounter = 0;

// ───────────────────────────── Provider ─────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ───────────────────────────── Hook ─────────────────────────────

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ───────────────────────────── Toast UI ─────────────────────────────

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', icon: CheckCircle, iconColor: 'text-emerald-400' },
  error:   { bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    icon: AlertCircle,  iconColor: 'text-rose-400' },
  warning: { bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   icon: AlertTriangle, iconColor: 'text-amber-400' },
  info:    { bg: 'bg-cyan-500/10',     border: 'border-cyan-500/25',    icon: Info,         iconColor: 'text-cyan-400' },
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        const Icon = style.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl
              ${style.bg} ${style.border} animate-slide-in-right`}
            role="alert"
          >
            <Icon size={18} className={`${style.iconColor} shrink-0 mt-0.5`} />
            <p className="text-sm text-white flex-1 leading-relaxed">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-500 hover:text-white transition-colors shrink-0 mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

"use client";

/**
 * Toasts.
 *
 * The old dashboard pushed every outcome into a single `error` string at the top
 * of a 780-line page, so a success was invisible and an error scrolled off
 * screen. These are anchored to the viewport and auto-dismiss.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from "./Icons";
import { cx } from "./Primitives";

const ToastContext = createContext(null);

const TONES = {
  success: { Icon: CheckIcon, cls: "border-positive/40 text-positive" },
  error: { Icon: AlertIcon, cls: "border-negative/40 text-negative" },
  info: { Icon: InfoIcon, cls: "border-info/40 text-info" },
};

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = "info", duration = 4200 } = {}) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, message, tone }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (message, options) => push(message, { ...options, tone: "success" }),
      error: (message, options) => push(message, { ...options, tone: "error", duration: 6000 }),
      info: (message, options) => push(message, { ...options, tone: "info" }),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const { Icon, cls } = TONES[toast.tone] ?? TONES.info;
          return (
            <div
              key={toast.id}
              className={cx(
                "vl-rise pointer-events-auto flex items-start gap-2.5 rounded-[10px] border bg-surface px-3.5 py-3 vl-shadow-lg",
                cls
              )}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <p className="min-w-0 flex-1 text-sm text-ink">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-faint transition-colors hover:text-ink"
              >
                <CloseIcon size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}

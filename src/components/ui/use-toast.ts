import { useCallback } from "react";

export type ToastVariant = "default" | "destructive" | "success" | "info";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastListener = (options: ToastOptions) => void;

const listeners = new Set<ToastListener>();

const fallbackToast = (options: ToastOptions) => {
  const parts = [options.title, options.description].filter(Boolean);
  if (!parts.length) {
    return;
  }

  const message = parts.join("\n");
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(message);
  } else {
    console.log("toast:", message);
  }
};

export const toast = (options: ToastOptions) => {
  if (listeners.size === 0) {
    fallbackToast(options);
    return;
  }

  listeners.forEach((listener) => listener(options));
};

export const subscribeToToasts = (listener: ToastListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useToast() {
  const pushToast = useCallback((options: ToastOptions) => {
    toast(options);
  }, []);

  return { toast: pushToast, subscribe: subscribeToToasts };
}

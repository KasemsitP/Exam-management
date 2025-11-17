// src/components/ui/bootstrap-toast.tsx
import { useEffect, useRef, useState } from "react";
import { ToastContainer, Toast } from "react-bootstrap";
import { subscribeToToasts, type ToastOptions, type ToastVariant } from "@/components/ui/use-toast";

type RBToastItem = Required<ToastOptions> & { id: string };

const headerByVariant = (v: ToastVariant) =>
  v === "success" ? "Success" : v === "info" ? "Information" : v === "destructive" ? "Error" : "Notification";
const bsBgByVariant = (v: ToastVariant) =>
  v === "success" ? "success" : v === "info" ? "info" : v === "destructive" ? "danger" : "light";

export function BootstrapToastViewport() {
  const [items, setItems] = useState<RBToastItem[]>([]);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    const unsub = subscribeToToasts((opts) => {
      const id = Math.random().toString(36).slice(2);
      const item: RBToastItem = {
        id,
        title: opts.title ?? headerByVariant(opts.variant ?? "default"),
        description: opts.description ?? "",
        variant: opts.variant ?? "default",
        duration: Math.max(1200, opts.duration ?? 3500),
      };
      setItems((prev) => [item, ...prev].slice(0, 5));
      timers.current[id] = window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
        delete timers.current[id];
      }, item.duration);
    });
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
      unsub();
    };
  }, []);

  const handleClose = (id: string) => {
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1080 }}>
      {items.map((t) => (
        <Toast key={t.id} bg={bsBgByVariant(t.variant)} onClose={() => handleClose(t.id)} role="status" aria-live="polite" autohide={false}>
          <Toast.Header closeButton>
            <strong className="me-auto">{t.title || headerByVariant(t.variant)}</strong>
          </Toast.Header>
          {t.description && (
            <Toast.Body className={t.variant === "default" ? "" : "text-white"}>{t.description}</Toast.Body>
          )}
        </Toast>
      ))}
    </ToastContainer>
  );
}

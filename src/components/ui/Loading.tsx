import React, { useEffect } from "react";
import { createPortal } from "react-dom";
declare global {
  interface Window {
    KTApp?: {
      showPageLoading: () => void;
      hidePageLoading: () => void;
    };
  }
}



type SpinnerType = "border" | "grow";

export interface OverlayLoaderProps {
  open: boolean;
  label?: string;
  spinner?: SpinnerType;
  zIndex?: number;
  backdropOpacity?: number; // 0 - 1
  blur?: boolean;           // เบลอพื้นหลัง
  lockScroll?: boolean;     // ปิดสกรอลล์หน้าขณะโหลด
  onOpenChange?: (open: boolean) => void;
}

const ensureBody = () => (typeof document !== "undefined" ? document.body : null);

export const OverlayLoader: React.FC<OverlayLoaderProps> = ({
  open,
  label = "Loading...",
  spinner = "border",
  zIndex = 2000,
  backdropOpacity = 0.25,
  blur = false,
  lockScroll = true,
  onOpenChange,
}) => {
  // แจ้ง KTApp ถ้ามี
  useEffect(() => {
    if (open) {
      window.KTApp?.showPageLoading?.();
    } else {
      window.KTApp?.hidePageLoading?.();
    }
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // ล็อกสกรอลล์
  useEffect(() => {
    if (!lockScroll) return;
    const body = ensureBody();
    if (!body) return;

    if (open) {
      const prev = body.style.overflow;
      body.style.overflow = "hidden";
      return () => {
        body.style.overflow = prev;
      };
    }
  }, [open, lockScroll]);

  if (!open) return null;
  const portalTarget = ensureBody();
  if (!portalTarget) return null;

  const backdropStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex,
    backgroundColor: `rgba(0,0,0,${backdropOpacity})`,
    backdropFilter: blur ? "blur(2px)" : undefined,
  };

  return createPortal(
    <div
      style={backdropStyle}
      className="d-flex align-items-center justify-content-center"
      aria-busy="true"
      aria-live="polite"
      role="alert"
    >
      <div className="d-flex flex-column align-items-center gap-3">
        {/* <span className={spinner === "border" ? "spinner-border" : "spinner-grow"} role="status" /> */}
        <span className="text-light fw-semibold">{label}</span>
      </div>
    </div>,
    portalTarget
  );
};

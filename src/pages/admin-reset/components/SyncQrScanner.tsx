import React, { useMemo, useEffect, useRef, useCallback, useState } from "react";
import { Scanner, boundingBox, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Loader2, Pause } from "lucide-react";
import Swal from "sweetalert2";

const DEFAULT_FORMATS: BarcodeFormat[] = ["qr_code", "micro_qr_code", "rm_qr_code"];

interface CustomSyncQrScannerProps {
  onScan: (text: string) => Promise<void> | void;
  isLoading?: boolean;
  isPaused?: boolean;
  facingMode?: "environment" | "user";
  cooldownMs?: number; 
  duplicateTimeoutMs?: number; 
  formats?: BarcodeFormat[];
  aspectRatio?: string;
  qrActive?: boolean;            
  minHeight?: string | number; 
  allowMultipleScans?: boolean;
}

const playBeep = () => {
  try {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800; 
    gainNode.gain.setValueAtTime(0.1, context.currentTime); 
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1); 
  } catch (err) {
    console.warn("Audio error", err);
  }
};

export const CustomSyncQrScanner = React.memo(({
  onScan,
  isLoading = false,
  isPaused = false,
  facingMode = "environment",
  qrActive = true,   
  cooldownMs = 300, 
  duplicateTimeoutMs = 1500, 
  formats = DEFAULT_FORMATS,
  aspectRatio = "1/1", 
  minHeight = 350,  
  allowMultipleScans = false,
}: CustomSyncQrScannerProps) => {

  const [busy, setBusy] = useState(false);
  const isProcessingRef = useRef(false);
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);

  const effectivePaused = isPaused || !qrActive;   
  const showLoadingOverlay = isLoading || busy;

  //  Ref สำหรับเก็บสถานะว่าโหลดอยู่ไหม เพื่อส่งไปให้ Tracker ใช้แบบ Real-time
  const showLoadingRef = useRef(showLoadingOverlay);
  useEffect(() => {
    showLoadingRef.current = showLoadingOverlay;
  }, [showLoadingOverlay]);

  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
    };
  }, []);

  const handleScan = useCallback(async (codes: IDetectedBarcode[]) => {
    if (!codes?.length) return;
    
    if (isProcessingRef.current) return;
    if (Swal.isVisible()) return;

    const rawValue = codes[0].rawValue;
    const now = Date.now();
    const last = lastScanRef.current;

    const GLOBAL_COOLDOWN = 1000;
    if (last && (now - last.time) < GLOBAL_COOLDOWN) {
      return; 
    }

    if (!allowMultipleScans) {
      if (last && last.code === rawValue && (now - last.time) < duplicateTimeoutMs) {
        return; 
      }
    }

    isProcessingRef.current = true;
    setBusy(true); 
    lastScanRef.current = { code: rawValue, time: now };

    playBeep();

    try {
      await onScan(rawValue);
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      while (Swal.isVisible()) {
        await new Promise((r) => setTimeout(r, 100));
      }
    } finally {
      isProcessingRef.current = false;
      setBusy(false);
    }
  }, [allowMultipleScans, duplicateTimeoutMs, onScan]);

  const handleError = useCallback((error: unknown) => {
    console.warn("Scanner error:", error);
  }, []);

  const customTracker = useCallback((detectedCodes: IDetectedBarcode[], ctx: CanvasRenderingContext2D) => {
    // 🔥 [จุดสำคัญ] ถ้าระบบกำลังโหลด หรือกำลังสแกนโค้ดอยู่ ให้เคลียร์เส้นทิ้งทันที! ไม่ต้องวาดต่อ
    if (showLoadingRef.current || isProcessingRef.current) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    if (detectedCodes && detectedCodes.length > 0) {
      boundingBox([detectedCodes[0]], ctx);
    }
  }, []);

  const constraints = useMemo(() => ({ facingMode }), [facingMode]);

  const styles = useMemo(() => ({
    container: { width: "100%", height: "100%" },
    video: { width: "100%", height: "100%", objectFit: "cover" as const },
  }), []);

  const components = useMemo(() => ({
    onOff: true,
    torch: true,
    zoom: true,
    finder: true,
    tracker: customTracker,
    audio: false, 
  }), [customTracker]);

  return (
    <div
      className="rounded overflow-hidden border bg-black position-relative w-100"
      style={{ aspectRatio, minHeight }}
    >
      {!effectivePaused ? (
        <Scanner
          formats={formats}
          onScan={handleScan}
          onError={handleError}
          constraints={constraints}
          styles={styles}
          components={components}
          allowMultiple={true} 
          scanDelay={cooldownMs} 
          paused={showLoadingOverlay} 
          sound={false} 
        />
      ) : !qrActive ? (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white">
          <Pause size={48} className="mb-3 opacity-50 text-danger" />
          <div className="fw-medium">ระบบสแกนคิวอาร์โค้ดถูกปิดโดยผู้ดูแล</div>
          <div className="small mt-1 text-light">กรุณาติดต่อเจ้าหน้าที่</div>
        </div>
      ) : (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white">
          <Pause size={48} className="mb-3 opacity-50 text-white" />
          <div className="fw-medium">กล้องถูกหยุดการใช้งาน</div>
          <div className="small mt-1 text-light">กดปุ่ม “เริ่ม” เพื่อเปิดกล้องอีกครั้ง</div>
        </div>
      )}

      {/* 🔥 [จุดสำคัญ] ปรับ zIndex ให้สูงเป็น 999 เพื่อบัง Canvas ให้มิด */}
      {showLoadingOverlay && !effectivePaused && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 999, backdropFilter: "blur(6px)" }}
        >
          <span className="text-white fw-medium">กำลังตรวจสอบ...</span>
        </div>
      )}
    </div>
  );
});

CustomSyncQrScanner.displayName = "CustomSyncQrScanner";
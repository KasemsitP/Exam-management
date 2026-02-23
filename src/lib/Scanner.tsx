import React, { useMemo, useEffect, useRef, useCallback } from "react";
import { Scanner, boundingBox, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Loader2, Pause } from "lucide-react";

const DEFAULT_FORMATS: BarcodeFormat[] = ["qr_code", "micro_qr_code", "rm_qr_code"];

interface CustomQrScannerProps {
  onResult: (text: string) => void;
  isLoading?: boolean;
  isPaused?: boolean;
  facingMode?: "environment" | "user";
  cooldownMs?: number; 
  duplicateTimeoutMs?: number; // ✅ เพิ่มระยะเวลาหน่วงโค้ดซ้ำ
  formats?: BarcodeFormat[];
  aspectRatio?: string;
  qrActive?: boolean;            
  minHeight?: string | number; 
  allowMultipleScans?: boolean; // เปิด/ปิดการยิงโค้ดเดิมซ้ำๆ
}

// ✅ ฟังก์ชันเสียง Beep
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

export const CustomQrScanner = React.memo(({
  onResult,
  isLoading = false,
  isPaused = false,
  facingMode = "environment",
  qrActive = true,   
  cooldownMs = 300, // ✅ ให้กล้องสแกนเร็วขึ้น (ทุกๆ 300ms)
  duplicateTimeoutMs = 1500, // ✅ โค้ดเดิมจะถูกบล็อคแค่ 1.5 วินาที
  formats = DEFAULT_FORMATS,
  aspectRatio = "1/1", 
  minHeight = 350,  
  allowMultipleScans = false,
}: CustomQrScannerProps) => {

  const onResultRef = useRef(onResult);
  // ✅ สร้างตัวจำโค้ดของเราเอง (ฉลาดกว่าของ Library)
  const lastScanRef = useRef<{ code: string; time: number } | null>(null);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const handleScan = useCallback((codes: IDetectedBarcode[]) => {
    if (!codes?.length) return;
    const rawValue = codes[0].rawValue;
    const now = Date.now();
    const last = lastScanRef.current;

    // ✅ ถ้าไม่อนุญาตให้ยิงซ้ำรัวๆ ให้มาเช็คเวลาตรงนี้
    if (!allowMultipleScans) {
      // ถ้าเป็นโค้ดเดิม และเวลาผ่านไปยังไม่ถึง 1.5 วินาที ให้ข้ามไป
      // แต่ถ้าถือแช่ไว้เกิน 1.5 วิ มันจะถือว่าเป็นรอบใหม่และสแกนให้ติดเอง!
      if (last && last.code === rawValue && (now - last.time) < duplicateTimeoutMs) {
        return; 
      }
    }

    // อัปเดตความจำของเรา
    lastScanRef.current = { code: rawValue, time: now };

    playBeep();
    onResultRef.current(rawValue);
  }, [allowMultipleScans, duplicateTimeoutMs]);

  const handleError = useCallback((error: unknown) => {
    console.warn("Scanner error:", error);
  }, []);

  const customTracker = useCallback((detectedCodes: IDetectedBarcode[], ctx: CanvasRenderingContext2D) => {
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
    audio: false, // ปิดเสียง Library
  }), []);

  const effectivePaused = isPaused || !qrActive;   

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
        allowMultiple={true} // 🔥 จุดสำคัญ! บังคับให้ Library ส่งข้อมูลมาเสมอ เพื่อแก้บัคแช่แล้วไม่ติด
        scanDelay={cooldownMs} 
        paused={isLoading}
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

      {isLoading && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10 }}
        >
          <Loader2 size={40} className="spin-animation text-white mb-2" />
          <span className="text-white fw-medium">กำลังตรวจสอบ...</span>
        </div>
      )}
    </div>
  );
});

CustomQrScanner.displayName = "CustomQrScanner";
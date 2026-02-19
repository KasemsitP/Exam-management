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
  formats?: BarcodeFormat[];
  aspectRatio?: string;
  qrActive?: boolean;           
  minHeight?: string | number; // ✅ เพิ่ม minHeight
}

export const CustomQrScanner = React.memo(({
  onResult,
  isLoading = false,
  isPaused = false,
  facingMode = "environment",
  qrActive = true,   
  cooldownMs = 1200,
  formats = DEFAULT_FORMATS,
  aspectRatio = "1/1", // ✅ เปลี่ยน Default เป็น จัตุรัส (1:1) จะพอดีสุด
  minHeight = 350,     // ✅ กำหนดความสูงขั้นต่ำเป็น 350px กันจอมือถือเล็กเกิน
}: CustomQrScannerProps) => {

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const handleScan = useCallback((codes: IDetectedBarcode[]) => {
    if (!codes?.length) return;
    onResultRef.current(codes[0].rawValue);
  }, []);

  const handleError = useCallback((error: unknown) => {
    console.warn("Scanner error:", error);
  }, []);

  const customTracker = useCallback((detectedCodes: IDetectedBarcode[], ctx: CanvasRenderingContext2D) => {
    if (detectedCodes && detectedCodes.length > 0) {
      // ส่งไปให้ boundingBox วาดแค่ index [0] (ตัวแรกที่โฟกัสได้) ตัวเดียวเท่านั้น
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
  }), []);

    const effectivePaused = isPaused || !qrActive;   // ✅ ถ้า backend ปิด -> หยุดทันที


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
        allowMultiple={false}
        scanDelay={cooldownMs}
        paused={isLoading}
      />
    ) : !qrActive ? (
      // 🔴 เคส backend ปิด
      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white">
        <Pause size={48} className="mb-3 opacity-50 text-danger" />
        <div className="fw-medium">ระบบสแกนคิวอาร์โค้ดถูกปิดโดยผู้ดูแล</div>
        <div className="small mt-1 text-light">
          กรุณาติดต่อเจ้าหน้าที่
        </div>
      </div>
    ) : (
      // 🟡 เคส user กด pause เอง
      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-white">
        <Pause size={48} className="mb-3 opacity-50 text-white" />
        <div className="fw-medium">กล้องถูกหยุดการใช้งาน</div>
        <div className="small mt-1 text-light">
          กดปุ่ม “เริ่ม” เพื่อเปิดกล้องอีกครั้ง
        </div>
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
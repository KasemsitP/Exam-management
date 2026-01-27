// components/QrScannerBox.tsx
import React, { useMemo } from "react";
import { Scanner, boundingBox } from "@yudiel/react-qr-scanner";
import { Pause } from "lucide-react";

type Props = {
  scannerEnabled: boolean;
  pause: boolean;
  facingMode: "environment" | "user";
  cooldownMs: number;
  onScan: (value: string) => void;
};

const QrScannerBox = React.memo(function QrScannerBox({
  scannerEnabled,
  pause,
  facingMode,
  cooldownMs,
  onScan,
}: Props) {
  //  ทำ object ให้คงที่ ไม่สร้างใหม่ทุก render
  const styles = useMemo(
    () => ({
      container: { width: "100%" },
      video: { width: "100%" },
    }),
    []
  );

  const components = useMemo(
    () => ({
      onOff: true,
      torch: true,
      zoom: true,
      finder: true,
      tracker: boundingBox,
    }),
    []
  );

  return (
    <div
      className="rounded overflow-hidden border bg-black mb-2 position-relative"
      style={{ minHeight: 220 }}
    >
      {!scannerEnabled && (
        <div
          className="d-flex flex-column justify-content-center align-items-center text-muted py-5"
          style={{ minHeight: 220 }}
        >
          <Pause className="mb-2" />
          <div>กล้องถูกหยุดอยู่ — กด “เริ่ม” เพื่อใช้งาน</div>
        </div>
      )}

      {scannerEnabled && (
        <>
          <Scanner
            formats={["qr_code", "micro_qr_code", "rm_qr_code"]}
            onScan={(codes) => {
              if (!codes?.length) return;
              onScan(codes[0].rawValue);
            }}
            onError={(e) => console.warn("scanner error:", e)}
            constraints={{ facingMode }}
            styles={styles}
            components={components}
            allowMultiple={false}
            scanDelay={cooldownMs}
            paused={pause}
          />

          {pause && (
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <Pause className="mb-2 text-white" />
              <div className="text-white text-center px-3">
                กำลังพักกล้องชั่วคราว
                <div className="small text-white-50">
                  กด “เริ่ม” เพื่อกลับไปสแกนต่อ
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default QrScannerBox;

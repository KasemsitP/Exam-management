import { useEffect, useMemo, useRef, useState } from "react";
import { Scanner, boundingBox } from "@yudiel/react-qr-scanner";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { useToast } from "@/components/ui/use-toast";
import {
  QrCode,
  Loader2,
  User,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  Camera,
  Pause,
  Play,
  Flashlight,
  RotateCcw,
  Keyboard,
} from "lucide-react";

import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectCurrentSession } from "@/store/slices/sessions.slice";
import {
  verifyQrCodeThunk,
  selectProctorScanState,
  clearScanResult,
} from "@/store/slices/qrscanner.slice";
import { UserSessionData } from "@/store/slices/userSessions.slice";

/* --------------------------- Scan Result Card --------------------------- */
const ScanResult = ({
  status,
  error,
  user,
  onClear,
}: {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  user: UserSessionData | null;
  onClear: () => void;
}) => {
  if (status === "loading") {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-5">
          <Loader2 size={36} className="spin-animation text-primary" />
          <div className="mt-3 small text-muted">กำลังตรวจสอบข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (status === "failed" || error) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-4">
          <XCircle size={48} className="mb-2 text-danger" />
          <h5 className="mb-2">สแกนล้มเหลว</h5>
          <div className="text-danger">{error ?? "QR Code ไม่ถูกต้องหรือไม่พบข้อมูล"}</div>
          <button className="btn btn-outline-danger mt-3" onClick={onClear}>
            ลองสแกนอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (status === "succeeded" && user) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body py-4">
          <div className="d-flex align-items-center gap-2 text-success mb-3">
            <CheckCircle2 /> <h5 className="mb-0">ยืนยันตัวตนสำเร็จ</h5>
          </div>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between">
              <span className="text-muted">ชื่อ-สกุล:</span>
              <span className="fw-semibold text-end">
                {user.firstName} {user.lastName}
              </span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span className="text-muted">รหัสผู้สอบ:</span>
              <span className="fw-semibold">{user.userCode}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span className="text-muted">ห้องสอบ:</span>
              <span className="fw-semibold">{user.roomName ?? "N/A"}</span>
            </li>
          </ul>
          <div className="text-center mt-3">
            <button className="btn btn-primary" onClick={onClear}>
              สแกนคนต่อไป
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body text-center py-5 text-muted">
        <ScanLine size={32} />
        <div className="mt-2">ยังไม่มีผลลัพธ์ — กรุณาสแกน QR Code ที่ใบเซ็นชื่อ</div>
      </div>
    </div>
  );
};

/* --------------------------- Page Component ---------------------------- */
export default function ProctorScanPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [pauseAfterSuccess, setPauseAfterSuccess] = useState(true);
  const [pause, setPause] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cooldownMs, setCooldownMs] = useState(1200);
  const lastScanRef = useRef<number>(0);
  const [manualPayload, setManualPayload] = useState("");

  const activeCampaign = useAppSelector(selectActiveCampaign);
  const currentSession = useAppSelector(selectCurrentSession);

  const { status, error, scannedUser } = useAppSelector(selectProctorScanState);

  const campaignLabel = activeCampaign?.name ?? "N/A";
  const sessionLabel = currentSession?.label ?? currentSession?.note ?? "N/A";

  // ปิด/เปิด pause เมื่อกำลังยิง API
  useEffect(() => {
    if (status === "loading") setPause(true);
    if (status === "succeeded") {
      setPause(pauseAfterSuccess);
      if (pauseAfterSuccess) setScannerEnabled(false);
    }
    if (status === "failed") {
      // เปิดกล้องอีกครั้งหลัง cool down สั้น ๆ
      setTimeout(() => {
        setPause(false);
        setScannerEnabled(true);
      }, 600);
    }
  }, [status, pauseAfterSuccess]);

  const canScan = useMemo(() => scannerEnabled && !pause && status !== "loading", [scannerEnabled, pause, status]);

  const verifyPayload = async (payload: string) => {
    if (!activeCampaign || !currentSession) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือก Campaign และ Session ก่อนสแกน",
        variant: "destructive",
      });
      return;
    }
    try {
      await dispatch(
        verifyQrCodeThunk({
          qrPayload: payload,
          campaignId: activeCampaign.id,
          sessionId: currentSession.id,
        })
      ).unwrap();
    } catch (err: any) {
      toast({
        title: "สแกนล้มเหลว",
        description: err?.message ?? "ไม่สามารถตรวจสอบ QR ได้",
        variant: "destructive",
      });
    }
  };

  const handleScan = async (data: string) => {
    const now = Date.now();
    if (!canScan) return;
    // กันยิงรัว ๆ
    if (now - lastScanRef.current < cooldownMs) return;
    lastScanRef.current = now;

    setScannerEnabled(false);
    setPause(true);
    await verifyPayload(data);

    // ถ้าไม่ pause หลัง success ให้เปิดสแกนต่ออัตโนมัติ
    if (!pauseAfterSuccess) {
      setTimeout(() => {
        setPause(false);
        setScannerEnabled(true);
      }, cooldownMs);
    }
  };

  const handleClear = () => {
    dispatch(clearScanResult());
    setManualPayload("");
    setPause(false);
    setScannerEnabled(true);
  };

  const handleManualSubmit = async () => {
    const value = manualPayload.trim();
    if (!value) {
      toast({ title: "ไม่มีข้อมูล", description: "กรุณาวาง/พิมพ์ QR payload ก่อน", variant: "destructive" });
      return;
    }
    setScannerEnabled(false);
    setPause(true);
    await verifyPayload(value);
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="mb-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <QrCode className="text-primary" size={28} />
              <h4 className="mb-0">สแกนยืนยันตัวตนผู้สอบ</h4>
            </div>
            <div className="small text-muted mt-1">
              รอบสอบ: <span className="fw-semibold">{sessionLabel}</span> | แคมเปญ:{" "}
              <span className="fw-semibold">{campaignLabel}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="form-check me-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="pauseAfterSuccess"
                checked={pauseAfterSuccess}
                onChange={(e) => setPauseAfterSuccess(e.target.checked)}
              />
              <label className="form-check-label small" htmlFor="pauseAfterSuccess">
                พักกล้องเมื่อสแกนสำเร็จ
              </label>
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: 130 }}
              value={cooldownMs}
              onChange={(e) => setCooldownMs(Number(e.target.value))}
              title="Cooldown ป้องกันสแกนซ้ำ"
            >
              <option value={800}>Cooldown: 0.8s</option>
              <option value={1200}>Cooldown: 1.2s</option>
              <option value={1600}>Cooldown: 1.6s</option>
              <option value={2000}>Cooldown: 2.0s</option>
            </select>

            <button
              className={`btn btn-${scannerEnabled ? "outline-secondary" : "success"} btn-sm d-inline-flex align-items-center gap-1`}
              onClick={() => {
                const next = !scannerEnabled;
                setScannerEnabled(next);
                setPause(!next ? true : false);
              }}
              title={scannerEnabled ? "หยุดกล้อง" : "เริ่มกล้อง"}
            >
              {scannerEnabled ? <Pause size={16} /> : <Play size={16} />}
              {scannerEnabled ? "หยุด" : "เริ่ม"}
            </button>

            <button
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
              onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
              title="สลับกล้อง"
            >
              <Camera size={16} /> สลับ
            </button>

            <button
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
              onClick={handleClear}
              title="ล้างผลลัพธ์"
            >
              <RotateCcw size={16} /> ล้าง
            </button>
          </div>
        </div>

        {/* Status ribbon */}
        <div className="mt-2">
          {status === "loading" && (
            <div className="alert alert-primary py-2 d-flex align-items-center gap-2 mb-0">
              <Loader2 className="spin-animation" size={16} />
              <span className="small">กำลังตรวจสอบข้อมูล…</span>
            </div>
          )}
          {status === "failed" && (
            <div className="alert alert-danger py-2 d-flex align-items-center gap-2 mb-0">
              <AlertTriangle size={16} />
              <span className="small">{error ?? "ตรวจสอบไม่สำเร็จ"}</span>
            </div>
          )}
          {status === "succeeded" && scannedUser && (
            <div className="alert alert-success py-2 d-flex align-items-center gap-2 mb-0">
              <CheckCircle2 size={16} />
              <span className="small">
                ยืนยัน: {scannedUser.firstName} {scannedUser.lastName} ({scannedUser.userCode})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="row g-4">
        {/* Left: Scanner */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <ScanLine className="text-primary" size={18} />
                <span className="fw-semibold">กล้องสแกน QR</span>
              </div>
              <div className="small text-muted">
                สถานะกล้อง:{" "}
                <span className={`badge ${scannerEnabled ? "bg-success" : "bg-secondary"}`}>
                  {scannerEnabled ? "พร้อม" : "หยุดอยู่"}
                </span>
              </div>
            </div>

            <div className="card-body">
              {scannerEnabled ? (
                <div className="rounded overflow-hidden border bg-black">
                  <Scanner
                    formats={["qr_code", "micro_qr_code", "rm_qr_code"]}
                    onScan={(codes) => {
                      if (!codes?.length) return;
                      const val = codes[0].rawValue;
                      handleScan(val);
                    }}
                    onError={(e) => console.warn("scanner error:", e)}
                    constraints={{ facingMode }}
                    styles={{ container: { width: "100%" }, video: { width: "100%" } }}
                    components={{
                      onOff: true,
                      torch: true,
                      zoom: true,
                      finder: true,
                      tracker: boundingBox,
                    }}
                    allowMultiple={false}
                    scanDelay={cooldownMs}
                    paused={pause}
                  />
                </div>
              ) : (
                <div className="text-center text-muted py-5 border rounded">
                  <Pause className="mb-2" />
                  <div>กล้องถูกหยุดอยู่ — กด “เริ่ม” เพื่อใช้งาน</div>
                </div>
              )}

              {/* Manual input */}
              <div className="mt-3">
                <label className="form-label small d-flex align-items-center gap-2">
                  <Keyboard size={16} /> กรอก/วาง QR Payload (สำรอง)
                </label>
                <div className="input-group">
                  <input
                    className="form-control"
                    placeholder="วางสตริงจาก QR ที่นี่…"
                    value={manualPayload}
                    onChange={(e) => setManualPayload(e.target.value)}
                  />
                  <button className="btn btn-outline-primary" onClick={handleManualSubmit} disabled={status === "loading"}>
                    ตรวจสอบ
                  </button>
                </div>
                <div className="form-text">
                  ใช้เมื่อกล้องอ่านไม่ติด หรือรับข้อมูลจากช่องทางอื่น (เช่น เจ้าหน้าที่กรอกแทน)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div className="col-12 col-lg-5">
          <ScanResult status={status} error={error} user={scannedUser} onClear={handleClear} />
          {/* Tips */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body small text-muted">
              <div className="fw-semibold mb-2">คำแนะนำ</div>
              <ul className="mb-0 ps-3">
                <li>เลือก “พักกล้องเมื่อสแกนสำเร็จ” เพื่อกันสแกนซ้ำซ้อน</li>
                <li>ปรับ Cooldown ให้เหมาะกับความเร็วการทำงานหน้างาน</li>
                <li>สลับกล้องหน้า/หลัง หากอุปกรณ์ถือไม่สะดวก</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

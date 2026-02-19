import React, { useCallback } from "react";
import Swal from "sweetalert2";
import {
  Loader2,
  XCircle,
  CheckCircle2,
  ScanLine,
  Camera,
  Pause,
  Play,
  RotateCcw,
  Keyboard,
} from "lucide-react";

import { useProctorScan } from "./hooks/useProctorScan";
import { userQR } from "@/store/slices/qrscanner.slice";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";
import { CustomQrScanner } from "@/lib/Scanner";

/* --------------------------- Scan Result Card --------------------------- */
const ScanResult = React.memo(({
  status,
  error,
  user,
  onClear,
}: {
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  user: userQR | null;
  onClear: () => void;
}) => {
  if (status === "loading") {
    return (
      <div className="card shadow-sm border-0 h-100">
        <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
          <Loader2 size={48} className="spin-animation text-primary mb-3" />
          <div className="fw-semibold">กำลังตรวจสอบข้อมูล...</div>
        </div>
      </div>
    );
  }

  if (status === "failed" || error) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex flex-column align-items-center justify-content-center py-5">
          <XCircle size={56} className="mb-3 text-danger" />
          <h5 className="mb-2">สแกนล้มเหลว</h5>
          <div className="text-danger text-center px-3 mb-4">
            {error ?? "QR Code ไม่ถูกต้องหรือไม่พบข้อมูล"}
          </div>
        </div>
      </div>
    );
  }

  if (status === "succeeded" && user) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body py-4">
          <div className="d-flex align-items-center gap-2 text-success mb-4 justify-content-center">
            <CheckCircle2 size={24} /> <h5 className="mb-0">ยืนยันตัวตนสำเร็จ</h5>
          </div>
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex justify-content-between align-items-center px-1">
              <span className="text-muted small">รอบสอบ</span>
              <span className="fw-semibold text-end">{user.campaignName ?? "N/A"}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center px-1">
              <span className="text-muted small">รหัส/วิชา</span>
              <span className="fw-semibold text-end">{user.session_code} {user.subjectName ?? "N/A"}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center px-1">
              <span className="text-muted small">ชื่อ-สกุล</span>
              <span className="fw-bold text-end text-primary">
                {user.firstName} {user.lastName}
              </span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center px-1">
              <span className="text-muted small">รหัสผู้สอบ</span>
              <span className="fw-semibold text-end font-monospace">{user.userCode}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center px-1">
              <span className="text-muted small">ห้องสอบ</span>
              <span className="fw-semibold text-end">{user.roomName ?? "N/A"}</span>
            </li>
            <li className="list-group-item d-flex justify-content-between align-items-center px-1">
              <span className="text-muted small">แถว</span>
              <span className="fw-semibold text-end">{user.rowNo ?? "N/A"}</span>
            </li>
          </ul>
          <div className="text-center mt-4">
            <button className="btn btn-primary w-100 py-2" onClick={onClear}>
              สแกนคนต่อไป
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex flex-column align-items-center justify-content-center py-5 text-muted">
        <ScanLine size={48} className="mb-3 opacity-50" />
        <h6 className="fw-normal">รอรับผลสแกน</h6>
        <div className="small px-4 text-center">
          กรุณาสแกน QR Code ที่ใบเซ็นชื่อเพื่อตรวจสอบข้อมูลผู้สอบ
        </div>
      </div>
    </div>
  );
});

/* --------------------------- Page Component ---------------------------- */
export default function ProctorScanPage() {
  const locked = useAppSelector(selectIsSystemLocked);

  const {
    campaignLabel,
    status,
    error,
    scannedUser,
    scannerEnabled,
    pauseAfterSuccess,
    setPauseAfterSuccess,
    pause,
    facingMode,
    cooldownMs,
    setCooldownMs,
    manualPayload,
    setManualPayload,
    handleScan,
    handleManualSubmit,
    handleClear,
    toggleScanner,
    toggleFacingMode,
    QRActive
  } = useProctorScan();

  //  รับค่าเป็น string ตรงๆ ตามที่ CustomQrScanner ส่งมาให้
  const onScannerResult = useCallback((val: string) => {
    handleScan(val);
  }, [handleScan]);

  return (
    <fieldset disabled={locked} style={{ opacity: locked ? 0.9 : 1 }}>
      <div className="container-fluid px-3 px-sm-4 py-3 gap-1 d-flex flex-column">
        {/* Header */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-white">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              {/* Title */}
              <div>
                <h5 className="mb-1">สแกนยืนยันตัวตนผู้สอบ</h5>
                <div className="small text-muted">
                  <span className="fw-semibold">{campaignLabel}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <div className="form-check form-switch me-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="pauseAfterSuccess"
                    checked={pauseAfterSuccess}
                    onChange={(e) => setPauseAfterSuccess(e.target.checked)}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="pauseAfterSuccess"
                  >
                    พักกล้องเมื่อสำเร็จ
                  </label>
                </div>

                <select
                  className="form-select form-select-sm"
                  style={{ width: 140 }}
                  value={cooldownMs}
                  onChange={(e) => setCooldownMs(Number(e.target.value))}
                >
                  <option value={800}>Cooldown 0.8s</option>
                  <option value={1200}>Cooldown 1.2s</option>
                  <option value={1600}>Cooldown 1.6s</option>
                  <option value={2000}>Cooldown 2.0s</option>
                </select>

                <button
                  className={`btn btn-sm ${scannerEnabled ? "btn-outline-secondary" : "btn-success"
                    } d-inline-flex align-items-center gap-1`}
                  onClick={toggleScanner}
                >
                  {scannerEnabled ? <Pause size={16} /> : <Play size={16} />}
                  {scannerEnabled ? "หยุด" : "เริ่ม"}
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={toggleFacingMode}
                >
                  <Camera size={16} /> สลับ
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={handleClear}
                >
                  <RotateCcw size={16} /> ล้าง
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="row g-4">
          {/* Left: Scanner */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-semibold">กล้องสแกน QR</span>
                </div>
                <div className="small text-muted">
                  สถานะกล้อง:{" "}
                  <span
                    className={`badge ${scannerEnabled ? "bg-success" : "bg-secondary"}`}
                  >
                    {scannerEnabled ? "พร้อม" : "หยุดอยู่"}
                  </span>
                </div>
              </div>

              <div className="card-body">

                {/* 🎯 เรียกใช้ CustomQrScanner (ในตัวมันมี Overlay และกรอบล็อคขนาดให้อยู่แล้ว) */}
                <CustomQrScanner
                  onResult={onScannerResult}
                  isLoading={status === "loading"}
                  isPaused={!scannerEnabled || pause}
                  facingMode={facingMode}
                  cooldownMs={cooldownMs}
                  aspectRatio="1/1" 
                  minHeight={350}  
                  qrActive={QRActive}
                />

                {/* Manual input */}
                <div className="mt-4">
                  <label className="form-label small d-flex align-items-center gap-2 fw-semibold text-muted">
                    กรอกรหัสคิวอาร์โค้ดด้วยตนเอง
                  </label>
                  <div className="input-group">
                    <input
                      className="form-control font-monospace"
                      placeholder="รหัสคิวอาร์โค้ดจากใบเซ็นชื่อ"
                      value={manualPayload}
                      onChange={(e) => setManualPayload(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    />
                    <button
                      className="btn btn-primary px-4"
                      onClick={handleManualSubmit}
                      disabled={status === "loading" || !manualPayload}
                    >
                      ตรวจสอบ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Result */}
          <div className="col-12 col-lg-5">
            <ScanResult
              status={status}
              error={error}
              user={scannedUser}
              onClear={handleClear}
            />
          </div>
        </div>
      </div>
    </fieldset>
  );
}
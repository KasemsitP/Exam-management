// components/ScannerPanel.tsx

import { CrmGrader } from "@/store/slices/graders.slice";
import {
  Camera,
  CheckCircle2,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  Scan,
} from "lucide-react";
import QrScannerBox from "./QRScannerBox";

interface ScannerPanelProps {
  scanData: string | null;
  manualPayload: string;
  score: string;
  scannerEnabled: boolean;
  pause: boolean;
  pauseAfterSuccess: boolean;
  cooldownMs: number;
  facingMode: "environment" | "user";
  isLoading: boolean;
  questionNo: number;
  bagNo: number | null;
  slotId: number | null;
  QuestionMaxScore: number | null;

  onChangePauseAfterSuccess: (checked: boolean) => void;
  onChangeCooldown: (ms: number) => void;
  onToggleScanner: () => void;
  onToggleFacingMode: () => void;
  onClear: () => void;
  setQuestionNo: (value: number) => void
  setQuestionMaxScore: (value: number) => void
  onChangeManualPayload: (value: string) => void;
  onVerifyManualPayload: () => void;
  onChangeScore: (value: string) => void;
  onConfirmScore: () => void;
  // requestCameraPermission: () => void;
  onScan: (value: string) => void;
  recent: CrmGrader[]
}

export default function ScannerPanel({
  scanData,
  manualPayload,
  score,
  scannerEnabled,
  pause,
  pauseAfterSuccess,
  cooldownMs,
  facingMode,
  isLoading,
  onChangePauseAfterSuccess,
  onChangeCooldown,
  onToggleScanner,
  onToggleFacingMode,
  onClear,
  onChangeManualPayload,
  onVerifyManualPayload,
  onChangeScore,
  // requestCameraPermission,
  onConfirmScore,
  onScan,
  recent,
  setQuestionNo,
  questionNo,
  bagNo,
  slotId,
  setQuestionMaxScore,
  QuestionMaxScore
}: ScannerPanelProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          {/* <Scan className="text-primary" size={18} /> */}
          <span className="fw-semibold">สแกนคิวอาร์โค้ดและบันทึกคะแนน</span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="small text-muted">
            สถานะกล้อง:{" "}
            <span
              className={`badge ${!scannerEnabled
                ? "bg-secondary"
                : pause
                  ? "bg-warning"
                  : "bg-success"
                }`}
            >
              {!scannerEnabled ? "หยุดอยู่" : pause ? "พักอยู่" : "พร้อม"}
            </span>
          </div>
          <div className="small text-muted">
            คะแนนเต็ม: {QuestionMaxScore !== null ? QuestionMaxScore : "-"}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 pt-2 d-flex flex-wrap align-items-center gap-2">
        {/* <div className="form-check me-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="pauseAfterSuccess"
            checked={pauseAfterSuccess}
            onChange={(e) => onChangePauseAfterSuccess(e.target.checked)}
          />
          <label className="form-check-label small" htmlFor="pauseAfterSuccess">
            พักกล้องเมื่อสแกนสำเร็จ
          </label>
        </div> */}

        {/* <select
          className="form-select form-select-sm"
          style={{ width: 130 }}
          value={cooldownMs}
          onChange={(e) => onChangeCooldown(Number(e.target.value))}
          title="Cooldown ป้องกันสแกนซ้ำ"
        >
          <option value={800}>Cooldown: 0.8s</option>
          <option value={1200}>Cooldown: 1.2s</option>
          <option value={1600}>Cooldown: 1.6s</option>
          <option value={2000}>Cooldown: 2.0s</option>
        </select> */}

        {/* <button
          className={`btn btn-${
            scannerEnabled ? "outline-secondary" : "success"
          } btn-sm d-inline-flex align-items-center gap-1`}
          onClick={onToggleScanner}
          title={scannerEnabled ? "หยุดกล้อง" : "เริ่มกล้อง"}
        >
          {scannerEnabled ? <Pause size={16} /> : <Play size={16} />}
          {scannerEnabled ? "หยุด" : "เริ่ม"}
        </button> */}
        <button
          className={`btn btn-${scannerEnabled ? "outline-secondary" : "success"
            } btn-sm d-inline-flex align-items-center gap-1`}
          onClick={onToggleScanner}
          title={scannerEnabled ? "หยุดกล้อง" : "เริ่มกล้อง"}
        >
          {scannerEnabled ? <Pause size={16} /> : <Play size={16} />}
          {scannerEnabled ? "หยุด" : "เริ่ม"}
        </button>

        <button
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
          onClick={onToggleFacingMode}
          title="สลับกล้อง"
        >
          <Camera size={16} /> สลับ
        </button>

        <button
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
          onClick={onClear}
          title="ล้างผลลัพธ์"
        >
          <RotateCcw size={16} /> ล้าง
        </button>

        <select
          className="form-select"
          value={questionNo ?? ""}
          onChange={(e) => {
            const val = e.target.value;

            if (val === "") {
              setQuestionNo(null);
              setQuestionMaxScore(null);
              return;
            }

            const num = Number(val);
            setQuestionNo(num);

            setQuestionMaxScore(
              recent.find(q => q.question_no === num)?.max_score ?? null
            );
          }}
        >
          <option value="">-- เลือก --</option>

          {recent.map((row) => (
            <option key={row.question_no} value={row.question_no}>
              ข้อ {row.question_no} วิชา {row.question_label}
            </option>
          ))}
        </select>

      </div>

      {/* Ribbon แจ้งรหัสล่าสุด */}
      {/* Ribbon แจ้งรหัสล่าสุด */}
      <div className="px-3 pt-2">
        {scanData ? (
          <div
            className="alert alert-success py-2 mb-0 d-flex align-items-start justify-content-between gap-3"
            role="alert"
          >
            {/* Left: main */}
            <div className="d-flex gap-2">
              <CheckCircle2 size={18} className="mt-1 flex-shrink-0" />
              <div className="d-flex flex-column">
                <div className="small fw-semibold">สแกนสำเร็จ</div>

                <div className="small text-break">
                  <span className="text-muted">รหัสข้อความ: </span>
                  <span
                    className="font-monospace"
                    style={{ wordBreak: "break-all" }}
                    title={scanData}
                  >
                    {scanData}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: meta */}
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <span className="badge text-bg-light border">
                หมายเลขถุง:{" "}
                <span className="font-monospace fw-bold fs-6">
                  {bagNo ?? "-"}
                </span>
              </span>

              <span className="badge text-bg-light border">
                เลข slot :{" "}
                <span className="font-monospace fw-bold fs-6">
                  {slotId ?? "-"}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div
            className="alert alert-secondary py-2 mb-0 d-flex align-items-center justify-content-between"
            role="status"
          >
            <span className="small">ยังไม่ได้สแกน — โปรดสแกนก่อนบันทึกคะแนน</span>
            <span className="badge text-bg-light border">Waiting</span>
          </div>
        )}
      </div>



      <div className="card-body">
        {/* Scanner */}
        <div className="card-body d-flex justify-content-center">
          <QrScannerBox
            scannerEnabled={scannerEnabled}
            pause={pause}
            facingMode={facingMode}
            cooldownMs={cooldownMs}
            onScan={onScan}
          />

        </div>

        {/* Manual input */}
        <div className="mt-3">
          <label className="form-label small d-flex align-items-center gap-2">
            วางคิวอาร์โค้ด
          </label>
          <div className="input-group">
            <input
              className="form-control"
              placeholder="วางสตริงจาก QR ที่นี่…"
              value={manualPayload}
              onChange={(e) => onChangeManualPayload(e.target.value)}
            />
            <button
              className="btn btn-outline-primary"
              onClick={onVerifyManualPayload}
            >
              ตรวจสอบ
            </button>
          </div>
          {/* <div className="form-text">
            ใช้เมื่อกล้องอ่านไม่ติด หรือรับข้อมูลจากช่องทางอื่น
          </div> */}
        </div>

        {/* Score form */}
        <div className="row g-3 mt-3">
          <div className="col-md-6">
            <label className="form-label">คะแนน</label>
            <input
              type="number"
              className="form-control"
              placeholder="กรุณากรอกคะแนนเป็นจำนวนเต็ม เช่น 0 , 2 , 5"
              value={score}
              onChange={(e) => onChangeScore(e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={onConfirmScore}
            disabled={isLoading}
          >
            {isLoading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <CheckCircle2 size={16} />
            )}
            {isLoading ? "กำลังบันทึก..." : "บันทึกคะแนน"}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              onChangeScore("");
            }}
          >
            ล้างข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}
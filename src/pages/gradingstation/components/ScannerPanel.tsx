// components/ScannerPanel.tsx

import { CrmGrader } from "@/store/slices/graders.slice";
import {
  Camera,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Scan,
} from "lucide-react";

// ✅ Import CustomQrScanner (ปรับ path ให้ตรงกับโปรเจกต์ของคุณ)
import { CustomQrScanner } from "@/lib/Scanner"; 

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
  questionNo: number | null;
  bagNo: number | null;
  slotId: number | null;
  QuestionMaxScore: number | null;
  QrActive: boolean;

  onChangePauseAfterSuccess: (checked: boolean) => void;
  onChangeCooldown: (ms: number) => void;
  onToggleScanner: () => void;
  onToggleFacingMode: () => void;
  onClear: () => void;
  setQuestionNo: (value: number | null) => void;
  setQuestionMaxScore: (value: number | null) => void;
  onChangeManualPayload: (value: string) => void;
  onVerifyManualPayload: () => void;
  onChangeScore: (value: string) => void;
  onConfirmScore: () => void;
  onScan: (value: string) => void;
  recent: CrmGrader[];
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
  onConfirmScore,
  onScan,
  recent,
  setQuestionNo,
  questionNo,
  bagNo,
  slotId,
  setQuestionMaxScore,
  QuestionMaxScore,
  QrActive
}: ScannerPanelProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className="fw-semibold">สแกนคิวอาร์โค้ดและบันทึกคะแนน</span>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="small text-muted">
            สถานะกล้อง:{" "}
            <span
              className={`badge ${
                !scannerEnabled
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
        <button
          className={`btn btn-${
            scannerEnabled ? "outline-secondary" : "success"
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
          className="form-select w-auto"
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
              recent.find((q) => q.question_no === num)?.max_score ?? null
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
      <div className="px-3 pt-2">
        {scanData ? (
          <div
            className="alert alert-success py-2 mb-0 d-flex align-items-start justify-content-between gap-3"
            role="alert"
          >
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

            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <span className="badge text-bg-light border">
                หมายเลขถุง:{" "}
                <span className="font-monospace fw-bold fs-6">
                  {bagNo ?? "-"}
                </span>
              </span>
              <span className="badge text-bg-light border">
                เลข slot:{" "}
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
        <div className="d-flex justify-content-center w-100">
          <div className="w-100" style={{ maxWidth: "500px" }}> {/* จำกัดความกว้างไม่ให้ใหญ่เกินไปในจอ PC */}
            {/* ✅ นำ CustomQrScanner มาแทน QrScannerBox */}
            <CustomQrScanner
              onResult={onScan}
              // ให้กล้องหยุดเมื่อ scannerEnabled=false หรือติดสถานะ pause อยู่
              isPaused={!scannerEnabled || pause} 
              // โยน isLoading ให้ CustomQrScanner เพื่อแสดง Overlay ตอนกำลังบันทึกคะแนน
              isLoading={isLoading} 
              facingMode={facingMode}
              cooldownMs={cooldownMs}
              aspectRatio="1/1" // ลองปรับเป็น 4/3 หรือ 1/1 ตามความสวยงามของหน้าจอ
              minHeight={300}
              // qrActive={QrActive}
            />
          </div>
        </div>

        {/* Manual input */}
        <div className="mt-4">
          <label className="form-label small d-flex align-items-center gap-2">
            วางคิวอาร์โค้ด
          </label>
          <div className="input-group">
            <input
              className="form-control"
              placeholder="วางสตริงจาก QR ที่นี่…"
              value={manualPayload}
              onChange={(e) => onChangeManualPayload(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onVerifyManualPayload()} // กด Enter เพื่อ Submit
            />
            <button
              className="btn btn-outline-primary"
              onClick={onVerifyManualPayload}
              disabled={!manualPayload || isLoading}
            >
              ตรวจสอบ
            </button>
          </div>
        </div>

        {/* Score form */}
        <div className="row g-3 mt-3">
          <div className="col-md-6">
            <label className="form-label">คะแนน</label>
            <input
              type="number"
              className="form-control form-control-lg" // เพิ่ม form-control-lg ให้ช่องกรอกคะแนนใหญ่ขึ้นเห็นชัด
              placeholder="กรุณากรอกคะแนน เช่น 0, 2, 5"
              value={score}
              onChange={(e) => onChangeScore(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirmScore()} // กด Enter เพื่อบันทึกคะแนน
              min={0}
              disabled={isLoading || !scanData} // ปิดช่องกรอกถ้ายังไม่ได้สแกน
            />
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-4"
            onClick={onConfirmScore}
            disabled={isLoading || !scanData || !score} // ปิดปุ่มถ้าข้อมูลไม่ครบ
          >
            {isLoading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <CheckCircle2 size={18} />
            )}
            {isLoading ? "กำลังบันทึก..." : "บันทึกคะแนน"}
          </button>
          <button
            className="btn btn-outline-secondary px-4"
            onClick={() => onChangeScore("")}
            disabled={isLoading || !score}
          >
            ล้างข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}
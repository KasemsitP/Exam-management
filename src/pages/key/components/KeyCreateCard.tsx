// components/KeyCreateCard.tsx
import { Lightbulb, Loader2, Minus, Plus, ShieldCheck, Key } from "lucide-react";

interface KeyCreateCardProps {
  firstKey: string;
  secondKey: string;
  firstKeyId: number | null;
  secondKeyId: number | null;
  manager1: string;
  manager2: string;

  onFirstKeyChange: (value: string) => void;
  onSecondKeyChange: (value: string) => void;

  onSaveFirstKey: () => void;
  onSaveSecondKey: () => void;

  onDeleteKey: (id: number) => void;

  canGenerate: boolean;
  isLoading: boolean;
  hasActiveCampaign: boolean;
  activeKeyCount: number;
  onRunBulkEncryption: () => void;
  headerSummary: {
    keyStatus: any;
    EncryptedStatus: any[];
  };
}


export default function KeyCreateCard({
  firstKey,
  secondKey,
  firstKeyId,
  secondKeyId,
  onFirstKeyChange,
  onSecondKeyChange,
  onSaveFirstKey,
  onSaveSecondKey,
  onDeleteKey,
  isLoading,
  hasActiveCampaign,
  activeKeyCount,
  onRunBulkEncryption,
  manager1,
  manager2,
  headerSummary
}: KeyCreateCardProps) {

  const allEncrypted =
    headerSummary.EncryptedStatus?.every(
      (s: any) => s.encryption_status === "ENCRYPTED_ALL"
    ) ?? false;


  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-header bg-white">
        <h6 className="mb-0 text-nowrap">1. กำหนดคีย์เข้ารหัส</h6>
      </div>

      <div className="card-body">
        <div className="row g-2 g-md-3">

          {/* ===== FIRST KEY ===== */}
          <div className="col-12 col-lg-8">
            <label className="form-label d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="text-nowrap">คีย์สำหรับการเข้ารหัสคนที่ 1</span>

              {manager1 && (
                <span className="badge bg-light text-danger fw-normal text-nowrap" style={{ fontSize: "0.75rem" }}>
                  {manager1}
                </span>
              )}
            </label>

            <input
              type="password"
              className="form-control form-control-sm"
              value={firstKey}
              onChange={(e) => onFirstKeyChange(e.target.value)}
              disabled={!!firstKeyId}
              placeholder="อัยการพิเศษฝ่าย (คก.2) คณะกรรมการ 2"
            />
          </div>

          <div className="col-12 col-lg-4 d-flex align-items-end gap-1 gap-sm-2">
            <button
              className="btn btn-sm btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={onSaveFirstKey}
              disabled={
                !!firstKeyId ||
                !firstKey.trim() ||
                !hasActiveCampaign
              }
              title="สร้างคีย์"
            >
              {isLoading ? <Loader2 size={14} className="spin-animation" /> : <Plus size={14} />}
              <span className="d-none d-sm-inline">สร้าง</span>
            </button>

            <button
              className="btn btn-sm btn-danger w-100 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={() => firstKeyId && onDeleteKey(firstKeyId)}
              disabled={!firstKeyId}
              title="ลบคีย์"
            >
              <Minus size={14} />
              <span className="d-none d-sm-inline">ลบ</span>
            </button>
          </div>

          {/* ===== SECOND KEY ===== */}
          <div className="col-12 col-lg-8">
            <label className="form-label d-flex align-items-center justify-content-between flex-wrap gap-2">
              <span className="text-nowrap">คีย์สำหรับการเข้ารหัสคนที่ 2</span>

              {manager2 && (
                <span className="badge bg-light text-danger fw-normal text-nowrap" style={{ fontSize: "0.75rem" }}>
                  {manager2}
                </span>
              )}
            </label>

            <input
              type="password"
              className="form-control form-control-sm"
              value={secondKey}
              onChange={(e) => onSecondKeyChange(e.target.value)}
              disabled={!!secondKeyId}
              placeholder="รองอธิบดีอัยการ"
            />
          </div>

          <div className="col-12 col-lg-4 d-flex align-items-end gap-1 gap-sm-2">
            <button
              className="btn btn-sm btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={onSaveSecondKey}
              disabled={
                !hasActiveCampaign ||
                !!secondKeyId ||
                !secondKey.trim()
              }
              title="สร้างคีย์"
            >
              {isLoading ? <Loader2 size={14} className="spin-animation" /> : <Plus size={14} />}
              <span className="d-none d-sm-inline">สร้าง</span>
            </button>

            <button
              className="btn btn-sm btn-danger w-100 d-inline-flex align-items-center justify-content-center gap-1"
              onClick={() => secondKeyId && onDeleteKey(secondKeyId)}
              disabled={!secondKeyId}
              title="ลบคีย์"
            >
              <Minus size={14} />
              <span className="d-none d-sm-inline">ลบ</span>
            </button>
          </div>
        </div>

        {activeKeyCount >= 2 && (
          <div
            className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 mt-3 p-2 p-sm-3 rounded border border-success bg-success bg-opacity-10"
          >
            <ShieldCheck size={16} className="text-success flex-shrink-0" />
            <div>
              {allEncrypted ? (
                <>
                  <div className="fw-semibold text-success small">
                    เข้ารหัสและสร้างคิวอาร์โค้ดแล้ว
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                    ระบบได้สร้างคิวอาร์โค้ดครบถ้วนแล้ว
                  </div>
                </>
              ) : (
                <>
                  <div className="fw-semibold text-primary small">
                    ระบบพร้อมสำหรับการเข้ารหัส
                  </div>
                  <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                    กรุณากดปุ่ม "เริ่มการเข้ารหัส"
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <div className="mt-3">
          <button className="btn btn-sm btn-success" onClick={onRunBulkEncryption} disabled={allEncrypted}>
            เริ่มการเข้ารหัส
          </button>
        </div>

      </div>
    </div>
  );
}


// components/KeyCreateCard.tsx
import { Lightbulb, Loader2, Minus, Plus, ShieldCheck , Key } from "lucide-react";

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
  manager2
}: KeyCreateCardProps) {
  return (
    <div className="card shadow-sm mb-4 mt-4">
      <div className="card-header bg-white">
        <h6 className="mb-0">1. กำหนดคีย์สำหรับการเข้ารหัสคิวอาร์โค้ด</h6>
      </div>

      <div className="card-body">
        <div className="row g-4">

          {/* ===== FIRST KEY ===== */}
          <div className="col-lg-8">
            <label className="form-label d-flex align-items-center justify-content-between">
              <span>คีย์สำหรับการเข้ารหัสคนที่ 1</span>

              {manager1 && (
                <span className="badge bg-light text-secondary fw-normal">
                  เข้ารหัสโดย {manager1}
                </span>
              )}
            </label>

            <input
              type="password"
              className="form-control"
              value={firstKey}
              onChange={(e) => onFirstKeyChange(e.target.value)}
              disabled={!!firstKeyId}
              placeholder="อัยการพิเศษฝ่าย (คก.2) คณะกรรมการ 2"
            />
          </div>

          <div className="col-lg-4 d-flex align-items-end gap-2">
            <button
              className="btn btn-primary w-100"
              onClick={onSaveFirstKey}
             
              disabled={
                !!firstKeyId ||
                !firstKey.trim() ||
                !hasActiveCampaign
              }
            >
              {isLoading ? <Loader2 size={16} className="spin-animation" /> : <Plus size={16} />}
              สร้าง
            </button>

            <button
              className="btn btn-danger w-100"
              onClick={() => firstKeyId && onDeleteKey(firstKeyId)}
              disabled={!firstKeyId}
            >
              <Minus size={16} /> ลบ
            </button>
          </div>

          {/* ===== SECOND KEY ===== */}
          <div className="col-lg-8">
            <label className="form-label d-flex align-items-center justify-content-between">
              <span>คีย์สำหรับการเข้ารหัสคนที่ 2</span>

              {manager2 && (
                <span className="badge bg-light text-secondary fw-normal">
                  เข้ารหัสโดย {manager2}
                </span>
              )}
            </label>

            <input
              type="password"
              className="form-control"
              value={secondKey}
              onChange={(e) => onSecondKeyChange(e.target.value)}
              disabled={!!secondKeyId}
               placeholder="รองอธิบดีอัยการ"
            />
          </div>

          <div className="col-lg-4 d-flex align-items-end gap-2">
            <button
              className="btn btn-primary w-100"
              onClick={onSaveSecondKey}
              disabled={
                !hasActiveCampaign ||
                !!secondKeyId ||
                !secondKey.trim()
              }
            >
              {isLoading ? <Loader2 size={16} className="spin-animation" /> : <Plus size={16} />}
              สร้าง
            </button>

            <button
              className="btn btn-danger w-100"
              onClick={() => secondKeyId && onDeleteKey(secondKeyId)}
              disabled={!secondKeyId}
            >
              <Minus size={16} /> ลบ
            </button>
          </div>
        </div>

        {activeKeyCount >= 2 && (
          <div
            className="d-flex align-items-center gap-2 mt-3 p-3 rounded border border-success bg-success bg-opacity-10"
          >
            <ShieldCheck size={18} className="text-success" />
            <div>
              <div className="fw-semibold text-success">
                ระบบพร้อมสำหรับการเข้ารหัส
              </div>
              <div className="small text-muted">
                รอบสอบนี้มีคีย์ความปลอดภัยครบทั้ง 2 อันแล้ว
              </div>
            </div>
          </div>
        )}
        <div className="mt-4">
          <button className="btn btn-success" onClick={onRunBulkEncryption}>
            เริ่มการเข้ารหัส
          </button>
        </div>

      </div>
    </div>
  );
}


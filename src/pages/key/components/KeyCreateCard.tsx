// components/KeyCreateCard.tsx
import { Loader2, Plus, ShieldCheck } from "lucide-react";

interface KeyCreateCardProps {
  keyInput: string;
  onKeyInputChange: (value: string) => void;
  canGenerate: boolean;
  isLoading: boolean;
  hasActiveCampaign: boolean;
  activeKeyCount: number;
  onSaveKey: () => void;
}

export default function KeyCreateCard({
  keyInput,
  onKeyInputChange,
  canGenerate,
  isLoading,
  hasActiveCampaign,
  activeKeyCount,
  onSaveKey,
}: KeyCreateCardProps) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white">
        <h6 className="mb-0">1. เพิ่มคีย์ (สูงสุด 2 คีย์)</h6>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-lg-8">
            <label htmlFor="key-input" className="form-label">
              คีย์ลับ (Key / Secret)
            </label>
            <input
              id="key-input"
              type="password"
              className="form-control"
              placeholder="กรอกคีย์ลับที่ต้องการบันทึก"
              value={keyInput}
              onChange={(e) => onKeyInputChange(e.target.value)}
              disabled={!canGenerate}
            />
          </div>
          <div className="col-lg-4 d-flex align-items-end">
            <button
              className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={onSaveKey}
              disabled={!canGenerate || !hasActiveCampaign || !keyInput.trim()}
            >
              {isLoading ? (
                <Loader2 size={16} className="spin-animation" />
              ) : (
                <Plus size={16} />
              )}
              สร้างคีย์ใหม่
            </button>
          </div>
        </div>

        {!canGenerate && activeKeyCount >= 2 && (
          <div className="alert alert-success small py-2 mt-3 mb-0">
            <ShieldCheck size={16} className="me-2" />
            รอบสอบนี้มีคีย์ครบ 2 อันแล้ว (ไม่สามารถเพิ่มได้)
          </div>
        )}
      </div>
    </div>
  );
}

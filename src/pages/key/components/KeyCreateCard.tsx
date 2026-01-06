// components/KeyCreateCard.tsx
import { Lightbulb, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";

interface KeyCreateCardProps {
  activeKeys: any[];
  myKeyId: number | null;
  IsHasKey: boolean
  keyInput: string;
  onKeyInputChange: (value: string) => void;
  onDeleteKey: (id: number) => void;
  canGenerate: boolean;
  isLoading: boolean;
  hasActiveCampaign: boolean;
  activeKeyCount: number;
  onSaveKey: () => void;
}

export default function KeyCreateCard({
  activeKeys,
  myKeyId,
  IsHasKey,
  keyInput,
  onKeyInputChange,
  onDeleteKey,
  canGenerate,
  isLoading,
  hasActiveCampaign,
  activeKeyCount,
  onSaveKey,
}: KeyCreateCardProps) {
  return (
    <div className="card shadow-sm mb-4 mt-4">
      <div className="card-header bg-white">
        <h6 className="mb-0">1.ลงทะเบียนคีย์เข้ารหัส</h6>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-lg-8">
            <label htmlFor="key-input" className="form-label">
              คีย์สำหรับการเข้ารหัส
            </label>
            <input
              id="key-input"
              type="password"
              className="form-control"
              placeholder="กรอกคีย์ลับที่ต้องการบันทึก"
              value={keyInput}
              onChange={(e) => onKeyInputChange(e.target.value)}
              disabled={!canGenerate || IsHasKey}
            />
          </div>
          <div className="col-lg-4 d-flex align-items-end gap-3">
            <button
              className="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={onSaveKey}
              disabled={!canGenerate || !hasActiveCampaign || !keyInput.trim() || IsHasKey}
            >
              {isLoading ? (
                <Loader2 size={16} className="spin-animation" />
              ) : (
                <Plus size={16} />
              )}
              สร้างคีย์ใหม่
            </button>
            <button
              className="btn btn-danger w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={() => myKeyId && onDeleteKey(myKeyId)}
              disabled={!IsHasKey || !myKeyId}
            >
              {isLoading ? (
                <Loader2 size={16} className="spin-animation" />
              ) : (
                <Minus size={16} />
              )}
              ลบคีย์
            </button>
            <button
              className="btn btn-secondary w-100 d-inline-flex align-items-center justify-content-center gap-2"
              onClick={onSaveKey}
              disabled={!IsHasKey}
            >
              {isLoading ? (
                <Loader2 size={16} className="spin-animation" />
              ) : (
                <Lightbulb size={16} />
              )}
              ลืมคีย์
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

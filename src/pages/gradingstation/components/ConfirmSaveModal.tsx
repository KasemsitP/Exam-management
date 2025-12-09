// components/ConfirmSaveModal.tsx
import { AlertCircle } from "lucide-react";

interface ConfirmSaveModalProps {
  open: boolean;
  scanData: string | null;
  score: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmSaveModal({
  open,
  scanData,
  score,
  isLoading,
  onClose,
  onConfirm,
}: ConfirmSaveModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop show" />
      <div
        className="modal show"
        style={{ display: "block" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title d-flex align-items-center gap-2">
                <AlertCircle className="text-primary" size={18} />
                ยืนยันการบันทึกคะแนน
              </h6>
              <button className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body small text-muted">
              <p>
                รหัสผู้เข้าสอบ:{" "}
                <span className="text-body">{scanData ?? "-"}</span>
              </p>
              <p>
                คะแนน: <span className="text-body">{score || "-"}</span>
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading && (
                  <span
                    className="spinner-border spinner-border-sm me-1"
                    role="status"
                    aria-hidden="true"
                  ></span>
                )}
                {isLoading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

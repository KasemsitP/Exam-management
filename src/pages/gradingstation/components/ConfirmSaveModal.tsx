// components/ConfirmSaveModal.tsx
import { AlertCircle } from "lucide-react";

interface ConfirmSaveModalProps {
  open: boolean;
  scanData: string | null;
  scores: Record<number, number>;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmSaveModal({
  open,
  scanData,
  scores,
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

              <div className="mt-2">
                <div className="fw-semibold text-body mb-1">คะแนนที่กรอก</div>

                {Object.keys(scores).length === 0 ? (
                  <div>-</div>
                ) : (
                  <ul className="mb-0 ps-3">
                    {Object.entries(scores).map(([questionNo, score]) => (
                      <li key={questionNo}>
                        ข้อ {questionNo}:{" "}
                        <span className="text-body">{score}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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

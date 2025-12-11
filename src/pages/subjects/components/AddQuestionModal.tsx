import React, { useEffect, useState } from "react";

interface AddQuestionModalProps {
  open: boolean;
  subjectCode?: string;
  subjectName?: string;
  maxQuestionNo: number; 
  onClose: () => void;
  onConfirm: (payload: { label: string; questionNo: number }) => void;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  open,
  subjectCode,
  subjectName,
  maxQuestionNo,
  onClose,
  onConfirm,
}) => {
  const [label, setLabel] = useState("");
  const [questionNo, setQuestionNo] = useState<number>(maxQuestionNo + 1 || 1);

  useEffect(() => {
    if (open) {
      setLabel("");
      setQuestionNo(maxQuestionNo + 1 || 1); 
    }
  }, [open, maxQuestionNo]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;

    let targetNo = questionNo || maxQuestionNo + 1;
    if (targetNo < 1) targetNo = 1;
    if (targetNo > maxQuestionNo + 1) targetNo = maxQuestionNo + 1;

    onConfirm({ label: trimmed, questionNo: targetNo });
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">เพิ่มข้อสอบใหม่</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                ></button>
              </div>

              <div className="modal-body">
                {subjectCode || subjectName ? (
                  <div className="mb-3 small text-muted">
                    วิชา:{" "}
                    <strong>
                      {subjectCode} {subjectName ? `- ${subjectName}` : ""}
                    </strong>
                  </div>
                ) : null}

                <div className="mb-1">
                  <label className="form-label">ลำดับข้อ (เลขข้อ)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={1}
                    max={maxQuestionNo + 1}
                    value={questionNo}
                    onChange={(e) => setQuestionNo(Number(e.target.value))}
                    disabled
                  />

                <div className="mb-3">
                  <label className="form-label">ชื่อหัวข้อของข้อสอบ</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="เช่น กฎหมายรัฐธรรมนูญ"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    autoFocus
                    
                  />
                </div>

                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!label.trim()}
                >
                  บันทึกข้อสอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default AddQuestionModal;

// src/pages/bags/components/CreateBagModal.tsx
import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateBagForm } from "../bags.types";

interface CreateBagModalProps {
  open: boolean;
  onClose: () => void;
  sessions: any[];
  createForm: UseFormReturn<CreateBagForm>;
  bagStatus: string;
  onSubmit: () => void; // จะเรียก handleBulkCreateBags จากหน้าใหญ่
}

export default function CreateBagModal({
  open,
  onClose,
  sessions,
  createForm,
  bagStatus,
  onSubmit,
}: CreateBagModalProps) {
  return (
    <div
      className={`modal ${open ? "show" : ""}`}
      style={{ display: open ? "block" : "none" }}
      aria-modal={open}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">สร้างถุงข้อสอบ </h6>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="bag-session" className="form-label">
                  เลือกรอบสอบ
                </label>
                <select
                  id="bag-session"
                  className="form-select"
                  {...createForm.register("sessionId", {
                    required: true,
                  })}
                >
                  <option value="">-- เลือกรอบสอบ --</option>
                  {sessions.map((session: any) => (
                    <option key={session.id} value={session.id}>
                      {session.label ?? session.title} ·{" "}
                      {new Date(
                        session.examDate
                      ).toLocaleDateString("th-TH")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-3">
                {/* prefix ตอนนี้คุณคอมเมนต์ออกไว้ ผมเลยตามให้เหมือนเดิม */}
                {/* 
                <div className="col-sm-6">
                  <label htmlFor="bag-prefix" className="form-label">
                    คำนำหน้า (Prefix)
                  </label>
                  <input
                    id="bag-prefix"
                    className="form-control"
                    {...createForm.register("prefix", { required: true })}
                  />
                </div>
                */}
                <div className="col-sm-6">
                  <label htmlFor="bag-count" className="form-label">
                    จำนวน (ถุง)
                  </label>
                  <input
                    id="bag-count"
                    type="number"
                    min={1}
                    className="form-control"
                    {...createForm.register("count", {
                      valueAsNumber: true,
                      required: true,
                      min: 1,
                    })}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label htmlFor="bag-capacity" className="form-label">
                  จำนวนเล่มต่อถุง
                </label>
                <input
                  id="bag-capacity"
                  type="number"
                  min={1}
                  className="form-control"
                  disabled
                  {...createForm.register("capacity", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
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
                disabled={bagStatus === "loading"}
              >
                {bagStatus === "loading" && (
                  <Loader2
                    size={16}
                    className="me-2 spin-animation"
                  />
                )}
                สร้าง {createForm.getValues("count") ?? 0} ถุง
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// src/pages/bag-handover/components/BagHandoverCheckinCard.tsx
import { HandCoins } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type {
  CheckoutFormValues,
  SessionSummary,
  BagSummary,
  GraderSummary,
  BagLock,
} from "../bagHandover.types";

interface Props {
  form: UseFormReturn<CheckoutFormValues>;
  sessions: SessionSummary[];
  locks: BagLock[];
  bagsForSelectedSession: BagSummary[];
  currentLock: BagLock | null;
  currentBag?: BagSummary;
  operator: any; // ใช้ type จาก auth.slice ได้ถ้ามี
  sessionIdInForm: string;
  selectedBagId: string;
  graders: GraderSummary[];

  onRegister: (values: CheckoutFormValues) => void;
  onReturn: () => void;
  setFilterSessionId: (value: string) => void;
  setSelectedBagId: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function BagHandoverCheckinCard({
  form,
  sessions,
  locks,
  bagsForSelectedSession,
  currentLock,
  currentBag,
  operator,
  sessionIdInForm,
  selectedBagId,
  graders,
  onRegister,
  onReturn,
  setFilterSessionId,
  setSelectedBagId,
  searchTerm,
  onSearchChange,
}: Props) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="mb-0">ลงทะเบียนถุงกับผู้ตรวจ</h6>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        <form
          onSubmit={form.handleSubmit(onRegister)}
          className="row g-3 align-items-end"
        >
          {/* Session select */}
          <div className="col-md-3">
            <label className="form-label text-muted small mb-1">
              เลือกรอบสอบ
            </label>
            <select
              className="form-select"
              {...form.register("sessionId", { required: true })}
              onChange={(e) => {
                form.setValue("sessionId", e.target.value);
                form.setValue("bagId", "");
                setFilterSessionId(e.target.value || "all");
              }}
            >
              <option value="">เลือกรอบสอบ</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label ?? session.title} (
                  {new Date(session.examDate).toLocaleDateString("th-TH")})
                </option>
              ))}
            </select>
          </div>

          {/* Bag select */}
          <div className="col-md-4">
            <label className="form-label text-muted small mb-1">
              เลือกถุง
            </label>
            <select
              className="form-select"
              value={form.watch("bagId")}
              onChange={(e) => {
                form.setValue("bagId", e.target.value);
                setSelectedBagId(e.target.value);
              }}
              disabled={!sessionIdInForm}
            >
              <option value="">
                {sessionIdInForm ? "เลือกถุงข้อสอบ" : "กรุณาเลือกรอบสอบก่อน"}
              </option>
              {bagsForSelectedSession.map((bag) => {
                const lock = locks.find(
                  (l) => String(l.bagId) === String(bag.id) // เดี๋ยวเราจะให้ bagId = PK เหมือนกัน
                );

                return (
                  <option
                    key={`sess-${bag.sessionId}-bag-${bag.id}`}  // ✅ key ยูนีคแน่ ๆ
                    value={String(bag.id)}                       // ✅ ใช้ PK เป็น value
                  >
                    {String(bag.bag_no).padStart(3, "0")} •{" "}
                    {bag.subjectName ?? "ไม่ระบุ"} ({bag.sessionLabel}){" "}
                    {lock ? `• กำลังตรวจโดย ${lock.graderName}` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Grader select */}
          <div className="col-md-3">
            <label className="form-label text-muted small mb-1">
              เลือกผู้ตรวจ
            </label>
            <select
              className="form-select"
              value={form.watch("graderId")}
              onChange={(e) => form.setValue("graderId", e.target.value)}
            >
              <option value="">เลือกผู้ตรวจ</option>
              {graders.map((grader) => (
                <option
                  key={grader.account_id}
                  value={String(grader.account_id)}
                >
                  {(
                    grader.grader_name ??
                    grader.name ??
                    `${grader.first_name ?? ""} ${grader.last_name ?? ""
                      }`.trim()
                  ) || `Grader #${grader.account_id}`}{" "}
                  • {grader.code ?? `G-${grader.account_id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div className="col-md-2">
            <label className="form-label text-muted small mb-1">
              ค้นหารหัสถุง
            </label>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center gap-2">
                <input
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ค้นหาจากรหัสถุง"
                  className="form-control"
                  style={{ width: 260 }}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="col-12 d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary flex-fill"
              disabled={!operator}
            >
              ลงทะเบียนส่งมอบ (Check-in)
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary flex-fill"
              onClick={onReturn}
              disabled={!currentLock}
            >
              รับคืนถุง (Check-out)
            </button>
          </div>
        </form>

        {selectedBagId && currentLock && (
          <div className="alert alert-success mt-3 mb-0 py-2">
            ถุง{" "}
            <strong>
              {String(
                currentBag?.bag_no ?? currentLock.bagId
              ).padStart(3, "0")}
            </strong>{" "}
            อยู่ระหว่างตรวจโดย {currentLock.graderName} ตั้งแต่{" "}
            {new Date(currentLock.at).toLocaleString("th-TH")}
          </div>
        )}
      </div>
    </div>
  );
}

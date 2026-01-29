// src/pages/accounts/components/GraderSubjectList.tsx
import ModalBackdrop from "./ModalBackdrop";
import type { Account } from "../types";

export type SimpleAssignment = {
  id: number;
  question_no: number;
  label: string;
  session_code : string 
  title : string
};

interface GraderSubjectListProps {
  open: boolean;
  account: Account | null;
  assignments: SimpleAssignment[];
  onClose: () => void;
}

export default function GraderSubjectList({
  open,
  account,
  assignments,
  onClose,
}: GraderSubjectListProps) {
  return (
    <>
      <ModalBackdrop open={open} />
      <div
        className={`modal ${open ? "show" : ""}`}
        style={{ display: open ? "block" : "none" }}
        role="dialog"
        aria-modal={open}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title">
                รายวิชาที่ผู้ตรวจ {account?.username ?? "-"} ได้รับมอบหมาย
              </h6>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {!account ? (
                <div className="text-muted">ไม่พบผู้ใช้</div>
              ) : assignments.length === 0 ? (
                <div className="alert alert-secondary mb-0">
                  ยังไม่มีรายวิชา/ข้อที่ได้รับมอบหมาย
                </div>
              ) : (
                <div className="table-responsive">
                  {/* รายวิชา {assignments[0]?.title} */}
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 80 }}>ข้อ</th>
                        <th>หัวข้อ</th>
                        <th>รายวิชา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={`${a.id}-${a.question_no}-${a.title}`}>
                          <td>ข้อ {a.question_no}</td>
                          <td>{a.label}</td>
                          <td>{a.title ?? a.session_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={onClose}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

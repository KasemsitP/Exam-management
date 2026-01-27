// src/pages/accounts/components/GraderSubjectList.tsx
import ModalBackdrop from "./ModalBackdrop";
import type { Account } from "../types";

// ✅ ปรับ field ให้ตรงของจริงจาก graders.slice
export type GraderAssignment = {
  campaign_id?: number;
  account_id?: number;

  session_id?: number;
  session_name?: string;

  subject_id: number;
  subject_code?: string;
  subject_name?: string;

  question_no: number;
  question_label?: string;
};

interface GraderSubjectListProps {
  open: boolean;
  account: Account | null;
  assignments: GraderAssignment[];
  onClose: () => void;
}

export default function GraderSubjectList({
  open,
  account,
  assignments,
  onClose,
}: GraderSubjectListProps) {
  const grouped = groupAssignments(assignments);

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
                รายวิชาที่ {account?.username ?? "-"} ได้รับมอบหมาย
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
                Object.entries(grouped).map(([sessionKey, block]) => (
                  <div key={sessionKey} className="mb-3">
                    <div className="fw-semibold mb-2">{block.sessionLabel}</div>

                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 140 }}>วิชา</th>
                            <th>ชื่อวิชา</th>
                            <th style={{ width: 220 }}>ข้อที่ตรวจ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.items.map((it) => (
                            <tr key={it.subjectKey}>
                              <td>{it.subjectCode ?? it.subjectId}</td>
                              <td>{it.subjectName ?? "-"}</td>
                              <td>{it.questionNos.join(", ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
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

function groupAssignments(assignments: GraderAssignment[]) {
  // sessionKey -> { sessionLabel, items: [ {subjectKey, subjectId, subjectCode, subjectName, questionNos[]} ] }
  const map: Record<
    string,
    {
      sessionLabel: string;
      subjects: Record<
        string,
        {
          subjectKey: string;
          subjectId: number;
          subjectCode?: string;
          subjectName?: string;
          questionNos: number[];
        }
      >;
    }
  > = {};

  for (const a of assignments) {
    const sessionKey = String(a.session_id ?? 0);
    const sessionLabel =
      a.session_name
        ? `รอบสอบ: ${a.session_name}`
        : a.session_id
        ? `รอบสอบ ID: ${a.session_id}`
        : "รอบสอบ: -";

    if (!map[sessionKey]) map[sessionKey] = { sessionLabel, subjects: {} };

    const subjectKey = String(a.subject_id);
    if (!map[sessionKey].subjects[subjectKey]) {
      map[sessionKey].subjects[subjectKey] = {
        subjectKey,
        subjectId: a.subject_id,
        subjectCode: a.subject_code,
        subjectName: a.subject_name ?? a.question_label, // เผื่อไม่มี subject_name
        questionNos: [],
      };
    }

    const arr = map[sessionKey].subjects[subjectKey].questionNos;
    if (!arr.includes(a.question_no)) arr.push(a.question_no);
  }

  const out: Record<string, { sessionLabel: string; items: any[] }> = {};
  for (const [k, v] of Object.entries(map)) {
    const items = Object.values(v.subjects).map((s) => ({
      ...s,
      questionNos: [...s.questionNos].sort((a: number, b: number) => a - b),
    }));
    out[k] = { sessionLabel: v.sessionLabel, items };
  }
  return out;
}

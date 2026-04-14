// components/GradingHeader.tsx
import { useState, useEffect } from "react";
import { AlertCircle, ClipboardList, KeyRound, Scan, UserRound } from "lucide-react";
import type { CrmGrader } from "@/store/slices/graders.slice";

interface GradingHeaderProps {
  user: any;
  graderProfile: CrmGrader | null;
  activeAssignment: CrmGrader | null;
  gradersStatus: "idle" | "loading" | "succeeded" | "failed" | string;
  gradersAssignment?: CrmGrader[];
}

export default function GradingHeader({
  user,
  graderProfile,
  activeAssignment,
  gradersStatus,
  gradersAssignment = [],
}: GradingHeaderProps) {
  const [showSubjects, setShowSubjects] = useState(false);

  useEffect(() => {
    if (showSubjects) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showSubjects]);

  return (
    <>
    <div className="card mb-3" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h1 className="h4 mb-0 d-flex align-items-center gap-2">
            {/* <Scan size={18} className="text-primary" /> */}
            บันทึกคะแนนผู้เข้าสอบ
          </h1>
          {graderProfile && activeAssignment && (
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
              onClick={() => setShowSubjects(true)}
            >
              <ClipboardList size={16} />
              รายวิชาที่ตรวจได้
            </button>
          )}
        </div>
        <div className="text-muted small mb-2">
          สำหรับผู้ตรวจคะแนน ใช้สแกน QR ของผู้เข้าสอบแล้วบันทึกคะแนน
        </div>

        {graderProfile && activeAssignment ? (
          <div className="d-flex flex-wrap gap-5 text-bold ">
            <span className="d-inline-flex align-items-center gap-3">
              <span>
                <span className="text-muted">ผู้ตรวจ: </span>
                <span className="fw-semibold text-dark">
                  {user?.name ?? "ผู้ตรวจไม่ทราบชื่อ"}
                </span>
              </span>

              <span>
                <span className="text-muted">ชื่อผู้ใช้งาน (username): </span>
                <span className="fw-semibold text-dark">
                  {user?.username ?? "unknown"}
                </span>
              </span>
            </span>

            {/* <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
              <ClipboardList size={14} />
              {activeAssignment.subject_name} (ข้อ {activeAssignment.question_no})
            </span>

            <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
              <KeyRound size={14} />
              เซสชัน: {activeAssignment.session_code ?? "-"}
            </span> */}
          </div>
        ) : (
          <div className="small text-warning d-flex align-items-center gap-1">
            <AlertCircle size={14} />
            {gradersStatus === "loading"
              ? "กำลังโหลดข้อมูลผู้ตรวจและงานที่ได้รับมอบหมาย..."
              : "ไม่พบงานที่ได้รับมอบหมายสำหรับบัญชีนี้ในแคมเปญนี้"}
          </div>
        )}
      </div>
    </div>

    {/* Subjects Modal */}
    {showSubjects && (
      <div
        className="modal d-block"
        tabIndex={-1}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={() => setShowSubjects(false)}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">รายวิชาที่สามารถตรวจได้</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowSubjects(false)}
              />
            </div>
            <div className="modal-body p-3">
              <div className="table-responsive">
                <table className="table table-sm table-striped table-hover align-middle mb-0 text-nowrap">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ width: 60 }} className="text-center">ลำดับ</th>
                      <th style={{ minWidth: 200 }} className="text-center">วิชา</th>
                      <th style={{ minWidth: 250 }} className="text-center">ชื่อหัวข้อ</th>
                      <th style={{ width: 100 }} className="text-center">หมายเลขข้อ</th>
                      <th style={{ width: 100 }} className="text-end">คะแนนเต็ม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradersAssignment.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          ยังไม่มีรายการที่สามารถตรวจได้
                        </td>
                      </tr>
                    ) : (
                      gradersAssignment.map((g, idx) => (
                        <tr key={`${g.subject_id}-${idx}`}>
                          <td className="text-center">{idx + 1}</td>
                          <td className="text-center">{g.session_code} {g.subject_name}</td>
                          <td className="text-center">{g.question_label}</td>
                          <td className="text-center">{g.question_no}</td>
                          <td className="text-center">{g.max_score}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

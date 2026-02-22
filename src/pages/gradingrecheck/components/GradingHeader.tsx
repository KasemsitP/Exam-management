// components/GradingHeader.tsx
import { AlertCircle, ClipboardList, KeyRound, Scan, UserRound } from "lucide-react";
import type { CrmGrader } from "@/store/slices/graders.slice";

interface GradingHeaderProps {
  user: any;
  graderProfile: CrmGrader | null;
  activeAssignment: CrmGrader | null;
  gradersStatus: "idle" | "loading" | "succeeded" | "failed" | string;
}

export default function GradingHeader({
  user,
  graderProfile,
  activeAssignment,
  gradersStatus,
}: GradingHeaderProps) {
  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <h1 className="h4 mb-2 d-flex align-items-center gap-2">
          {/* <Scan size={18} className="text-primary" /> */}
          บันทึกคะแนนผู้เข้าสอบ
        </h1>
        <div className="text-muted small mb-2">
          สำหรับผู้ตรวจคะแนน ใช้สแกน QR ของผู้เข้าสอบแล้วบันทึกคะแนน
        </div>

        {graderProfile && activeAssignment ? (
          <div className="d-flex flex-wrap gap-2 small">
            <span className="badge text-bg-light d-inline-flex align-items-center gap-1 text-capitalize">
              {(user as any)?.full_name ??
                user?.username ??
                `Grader #${activeAssignment.grader_name}`}
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
              ? "กำลังโหลดข้อมูลผู้ตรวจและวิชาที่ได้รับมอบหมาย..."
              : "ไม่พบวิชาที่ได้รับมอบหมายสำหรับบัญชีนี้ในรอบสอบนี้"}
          </div>
        )}
      </div>
    </div>
  );
}

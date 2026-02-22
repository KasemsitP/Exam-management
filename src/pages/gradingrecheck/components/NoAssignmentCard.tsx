// components/NoAssignmentCard.tsx
import { AlertCircle } from "lucide-react";

interface NoAssignmentCardProps {
  gradersStatus: string;
}

export default function NoAssignmentCard({ gradersStatus }: NoAssignmentCardProps) {
  return (
    <div className="card border-dashed">
      <div className="card-header bg-white">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <AlertCircle className="text-primary" size={18} />
          {gradersStatus === "loading"
            ? "กำลังค้นหาวิชาที่ได้รับมอบหมายให้ตรวจ..."
            : "ไม่พบวิชาที่ได้รับมอบหมายให้ตรวจ"}
        </h6>
      </div>
      <div className="card-body text-muted small">
        {gradersStatus === "loading"
          ? "กำลังดึงข้อมูลวิชาและข้อที่ต้องตรวจ..."
          : "ไม่พบข้อมูลการมอบหมายวิชาสำหรับผู้ตรวจนี้ในรอบสอบนี้"}
      </div>
    </div>
  );
}

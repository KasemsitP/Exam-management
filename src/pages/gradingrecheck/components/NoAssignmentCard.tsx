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
            ? "กำลังค้นหางานที่ได้รับมอบหมาย..."
            : "ไม่พบงานที่ได้รับมอบหมาย"}
        </h6>
      </div>
      <div className="card-body text-muted small">
        {gradersStatus === "loading"
          ? "กำลังดึงข้อมูลวิชาและข้อที่ต้องตรวจจากเซิร์ฟเวอร์..."
          : "ไม่พบข้อมูลการมอบหมายงานสำหรับผู้ตรวจนี้ในแคมเปญนี้"}
      </div>
    </div>
  );
}

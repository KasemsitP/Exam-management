// components/NoProfileCard.tsx
import { AlertCircle } from "lucide-react";

interface NoProfileCardProps {
  gradersStatus: string;
}

export default function NoProfileCard({ gradersStatus }: NoProfileCardProps) {
  return (
    <div className="card border-dashed">
      <div className="card-header bg-white">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <AlertCircle className="text-primary" size={18} />
          ไม่พบวิชาที่ได้รับมอบหมายให้ตรวจ
        </h6>
      </div>
      <div className="card-body text-muted small">
        {gradersStatus === "loading" && <span>กำลังโหลดโปรไฟล์ผู้ตรวจ...</span>}
        {gradersStatus === "succeeded" && (
          <span>ไม่พบโปรไฟล์ผู้ตรวจสำหรับบัญชีของคุณในรอบสอบนี้</span>
        )}
      </div>
    </div>
  );
}

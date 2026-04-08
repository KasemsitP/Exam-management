// components/NoAssignmentCard.tsx
import { AlertCircle } from "lucide-react";


export default function NoLinkCard({ islinkedsession }: { islinkedsession: boolean }) {
  return (
    <div className="card border-dashed">
      <div className="card-header bg-white">
        <h6 className="mb-0 d-flex align-items-center gap-2">
          <AlertCircle className="text-primary" size={18} />
              ไม่พบข้อมูลการผูกวิชากับวันที่สอบสำหรับรอบสอบนี้
        </h6>
      </div>
      <div className="card-body text-muted small">
            กรุณาผูกวิชาที่สอบกับวันที่สอบก่อนเพื่อจัดการคีย์การเข้ารหัสได้
      </div>
    </div>
  );
}

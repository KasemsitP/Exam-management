// components/ImportHeader.tsx
import { FileSpreadsheet } from "lucide-react";

export default function ImportHeader() {
  return (
    <div className="d-flex align-items-start gap-3 mb-3">
      <div className="rounded-circle bg-primary-subtle p-2 text-primary d-inline-flex">
        <FileSpreadsheet size={24} />
      </div>
      <div>
        <h1 className="h4 mb-1">นำเข้าข้อมูลรายชื่อผู้เข้าสอบ (CSV / Excel)</h1>
        <p className="text-muted small mb-0">
          อัปโหลดไฟล์ CSV หรือ Excel ที่มีรายชื่อผู้เข้าสอบ
        </p>
      </div>
    </div>
  );
}

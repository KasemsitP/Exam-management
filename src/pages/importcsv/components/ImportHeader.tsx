
import {User2Icon} from "lucide-react"

interface ImportHeaderProps {
  UserNum: number | null;
}



export default function ImportHeader({ UserNum }: ImportHeaderProps) {
  return (
    <div
      className="card"
      style={{
        border: 0,
        boxShadow:
          "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        
        {/* ซ้าย */}
        <div>
          <h5 className="mb-1 d-flex align-items-center gap-2">
            นำเข้าข้อมูลผู้สอบ
          </h5>
          <small className="text-muted">
            นำข้อมูลเข้าสู่รอบสอบ
          </small>
        </div>

        {/* ขวา */}
        <div className="text-lg-end">
          <small className="badge text-bg-success d-inline-flex align-items-center gap-1 text-nowrap">
            <User2Icon size={14} />
            จำนวนผู้สอบทั้งหมด: {UserNum ?? "กำลังโหลด..."}
          </small>
        </div>

      </div>
    </div>
  );
}

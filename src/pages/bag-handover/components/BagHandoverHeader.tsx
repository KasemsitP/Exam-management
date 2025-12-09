// src/pages/bag-handover/components/BagHandoverHeader.tsx
import { Search } from "lucide-react";

interface BagHandoverHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function BagHandoverHeader({
  searchTerm,
  onSearchChange,
}: BagHandoverHeaderProps) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div>
            <h5 className="card-title mb-1 text-body">
              ลงทะเบียนผู้ตรวจกับถุง
            </h5>
            <p className="card-text text-muted mb-0">
              บันทึกการส่งมอบถุงข้อสอบให้ผู้ตรวจ
              เพื่อป้องกันการใช้งานซ้ำและติดตามการทำงานแบบเรียลไทม์
            </p>
          </div>

          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center gap-2">
              <Search size={16} className="text-muted" />
              <input
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ค้นหาจากรหัสถุง รอบสอบ หรือรายวิชา"
                className="form-control"
                style={{ width: 260 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

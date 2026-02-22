// src/pages/accounts/components/AccountsHeader.tsx
import { Users, CheckCircle2, X } from "lucide-react";
import type { AccountStats } from "../types";

interface AccountsHeaderProps {
  stats: AccountStats;
}

export default function AccountsHeader({ stats }: AccountsHeaderProps) {
  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-header bg-white">
        <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3">
          <div>
            <h5 className="mb-1">จัดการบัญชีผู้ใช้</h5>
            <small className="text-muted">
              เพิ่ม ลบ แก้ไข และกำหนดสิทธิ์ผู้ใช้งานระบบ
            </small>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1 text-nowrap">
              <Users size={14} /> ทั้งหมด {stats.total}
            </span>
            <span className="badge text-bg-success d-inline-flex align-items-center gap-1 text-nowrap">
              <CheckCircle2 size={14} /> Active {stats.active}
            </span>
            <span className="badge text-bg-light d-inline-flex align-items-center gap-1 text-nowrap">
              <X size={14} /> Inactive {stats.inactive}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

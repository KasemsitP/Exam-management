// src/pages/accounts/components/AccountsToolbar.tsx
import { Search, Plus } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import type { Role, RoleFilter, ActiveFilter } from "../types";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";

interface SessionSubjectOption {
  key: string;
  session_id: number;
  subject_id: number;
  session_code: string;
  subject_name: string;
  subject_code: string;
  exam_date: string;
}

interface AccountsToolbarProps {
  searchText: string;
  onSearchChange: (value: string) => void;

  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;

  activeFilter: ActiveFilter;
  onActiveFilterChange: (value: ActiveFilter) => void;

  sessionSubjectFilter: string | "all";
  onSessionSubjectFilterChange: (value: string | "all") => void;

  sessionSubjectOptions: SessionSubjectOption[];

  roles: Role[];

  onOpenCreate: () => void;
}

export default function AccountsToolbar({
  searchText,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  activeFilter,
  onActiveFilterChange,
  sessionSubjectFilter,
  onSessionSubjectFilterChange,
  sessionSubjectOptions,
  roles,
  onOpenCreate,
}: AccountsToolbarProps) {
  const locked = useAppSelector(selectIsSystemLocked);


  return (
      <div className="card" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)' }}>
        <div className="card-body d-flex flex-column flex-md-row gap-3 align-items-md-end justify-content-between">
          <div className="w-100 d-flex flex-column flex-lg-row gap-3">
            {/* Search */}
            <div className="flex-fill">
              <label htmlFor="acc-search" className="form-label small text-muted">
                ค้นหา
              </label>
              <div className="position-relative">
                <Search
                  className="position-absolute"
                  size={16}
                  style={{
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="acc-search"
                  value={searchText}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="ค้นหา username, ชื่อ-สกุล"
                  className="form-control ps-5"
                />
              </div>
            </div>

            {/* Role filter */}
            <div style={{ minWidth: 220 }}>
              <label htmlFor="role-filter" className="form-label small text-muted">
                บทบาท
              </label>
              <select
                id="role-filter"
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  onRoleFilterChange(v === "all" ? "all" : Number(v));
                }}
                disabled={true}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Active filter */}
            <div style={{ minWidth: 220 }}>
              <label htmlFor="active-filter" className="form-label small text-muted">
                สถานะการใช้งาน
              </label>
              <select
                id="active-filter"
                className="form-select"
                value={activeFilter}
                onChange={(e) => onActiveFilterChange(e.target.value as any)}
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">เฉพาะกำลังเปิดใช้งาน</option>
                <option value="inactive">เฉพาะกำลังปิดใช้งาน</option>
              </select>
            </div>

            {/* Session + Subject combined filter */}
            <div style={{ minWidth: 280 }}>
              <label htmlFor="session-subject-filter" className="form-label small text-muted">
                วันที่สอบ / วิชา
              </label>
              <select
                id="session-subject-filter"
                className="form-select"
                value={sessionSubjectFilter}
                onChange={(e) => onSessionSubjectFilterChange(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                {sessionSubjectOptions.map((s) => {
                  const dateLabel = s.exam_date
                    ? new Date(s.exam_date).toLocaleDateString("th-TH")
                    : s.session_code;
                  return (
                    <option key={s.key} value={s.key}>
                      {`${dateLabel} - วิชา${s.subject_name}`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Create button */}
          <div>
            <ShowIfCan permission="manage_accounts">
              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                onClick={onOpenCreate}
                disabled={locked}
              >
                <Plus size={16} /> สร้างผู้ใช้ใหม่
              </button>
            </ShowIfCan>
          </div>
        </div>
      </div>
  );
}

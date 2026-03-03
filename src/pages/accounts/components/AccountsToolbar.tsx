// src/pages/accounts/components/AccountsToolbar.tsx
import { Search, Plus } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import type { Role, RoleFilter, ActiveFilter } from "../types";

interface AccountsToolbarProps {
  searchText: string;
  onSearchChange: (value: string) => void;

  roleFilter: RoleFilter;
  onRoleFilterChange: (value: RoleFilter) => void;

  activeFilter: ActiveFilter;
  onActiveFilterChange: (value: ActiveFilter) => void;

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
  roles,
  onOpenCreate,
}: AccountsToolbarProps) {
  return (
    <div className="card" style={{ border: 0, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)" }}>
      <div className="card-body">
        <div className="d-flex flex-column flex-lg-row gap-3 align-items-stretch align-items-lg-end">
          <div className="w-100 d-flex flex-column flex-md-row gap-3">
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
            <div style={{ minWidth: 180 }}>
              <label htmlFor="role-filter" className="form-label small text-muted">
                ฟิลเตอร์ตาม Role
              </label>
              <select
                id="role-filter"
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  onRoleFilterChange(v === "all" ? "all" : Number(v));
                }}
              >
                <option value="all">ทุก Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Active filter */}
            <div style={{ minWidth: 180 }}>
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
                <option value="active">เฉพาะ Active</option>
                <option value="inactive">เฉพาะ Inactive</option>
              </select>
            </div>
          </div>

          {/* Create button */}
          <div className="flex-shrink-0">
            <ShowIfCan permission="manage_accounts">
              <button
                className="btn btn-primary d-inline-flex align-items-center gap-2 w-100 w-lg-auto text-nowrap"
                onClick={onOpenCreate}
              >
                <Plus size={16} /> สร้างผู้ใช้ใหม่
              </button>
            </ShowIfCan>
          </div>
        </div>
      </div>
    </div>
  );
}

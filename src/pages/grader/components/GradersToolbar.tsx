// src/pages/accounts/components/AccountsToolbar.tsx
import { Search, Plus } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import type { Role, RoleFilter, ActiveFilter } from "../types";
import { selectIsSystemLocked } from "@/store/slices/examData.slice";
import { useAppSelector } from "@/store/hook";

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
  const locked = useAppSelector(selectIsSystemLocked);


  return (
      <div className="card shadow-sm">
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
                  placeholder="ค้นหา username, ชื่อ-สกุล, หรือ email"
                  className="form-control ps-5"
                />
              </div>
            </div>

            {/* Role filter */}
            <div style={{ minWidth: 220 }}>
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
                <option value="active">เฉพาะ Active</option>
                <option value="inactive">เฉพาะ Inactive</option>
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

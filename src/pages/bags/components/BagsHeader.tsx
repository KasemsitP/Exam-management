// src/pages/bags/components/BagsHeader.tsx
import { Search, QrCode, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

interface BagsHeaderProps {
  bagStats: { total: number; completed: number; inProgress: number };
  sessions: any[];
  searchText: string;
  onSearchTextChange: (value: string) => void;
  filterSessionId: string;
  onFilterSessionChange: (value: string) => void;
  onOpenCreateDialog: () => void;
  activeCampaignPresent: boolean;
}

export default function BagsHeader({
  bagStats,
  sessions,
  searchText,
  onSearchTextChange,
  filterSessionId,
  onFilterSessionChange,
  onOpenCreateDialog,
  activeCampaignPresent,
}: BagsHeaderProps) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <h5 className="mb-1">จัดการถุงข้อสอบ</h5>
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <span className="badge text-bg-secondary d-inline-flex align-items-center gap-1">
              <QrCode size={14} /> ทั้งหมด {bagStats.total}
            </span>
            <span className="badge text-bg-success d-inline-flex align-items-center gap-1">
              <CheckCircle2 size={14} /> พร้อมใช้ {bagStats.completed}
            </span>
            <span className="badge text-bg-warning d-inline-flex align-items-center gap-1">
              <AlertTriangle size={14} /> ระหว่างทำ {bagStats.inProgress}
            </span>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="card-body d-flex flex-column flex-md-row gap-2 align-items-md-end justify-content-between">
        <div className="w-100 d-flex flex-column flex-md-row gap-2">
          {/* Search */}
          <div className="flex-fill">
            <label
              htmlFor="bag-search"
              className="form-label small text-muted"
            >
              ค้นหา (รหัสถุง, วิชา)
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
                id="bag-search"
                value={searchText}
                onChange={(e) => onSearchTextChange(e.target.value)}
                placeholder="ค้นหาเลขถุง, รอบสอบ, หรือวิชา"
                className="form-control ps-5"
              />
            </div>
          </div>

          {/* Session Filter */}
          <div style={{ minWidth: "220px" }}>
            <label
              htmlFor="session-filter"
              className="form-label small text-muted"
            >
              ฟิลเตอร์รอบสอบ
            </label>
            <select
              id="session-filter"
              className="form-select"
              value={filterSessionId}
              onChange={(e) => onFilterSessionChange(e.target.value)}
            >
              <option value="all">แสดงทุกรอบสอบ</option>
              {sessions.map((session: any) => (
                <option key={session.id} value={session.id}>
                  {session.label ?? session.title} (
                  {new Date(session.examDate).toLocaleDateString("th-TH")})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-3 pt-md-0">
          <ShowIfCan permission="manage_bags">
            <button
              className="btn btn-primary d-inline-flex align-items-center gap-2 w-100"
              onClick={onOpenCreateDialog}
              disabled={!activeCampaignPresent}
            >
              <Plus size={16} /> สร้างถุงข้อสอบ
            </button>
          </ShowIfCan>
        </div>
      </div>
    </div>
  );
}

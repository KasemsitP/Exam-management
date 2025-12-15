// src/pages/campaigns/components/CampaignFiltersCard.tsx
import { CalendarDays, Plus, Search } from "lucide-react";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

interface CampaignFiltersCardProps {
  textFilter: string;
  onTextFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  sessionCount: number;
  onResetFilters: () => void;
  onCreateCampaign: () => void;
}

export function CampaignFiltersCard({
  textFilter,
  onTextFilterChange,
  dateFilter,
  onDateFilterChange,
  sessionCount,
  onResetFilters,
  onCreateCampaign,
}: CampaignFiltersCardProps) {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-white">
        <div className="d-flex flex-column flex-lg-row gap-3 align-items-start align-items-lg-center justify-content-lg-between">
          <div>
            <h5 className="card-title mb-1 fs-6">สร้างรอบสอบและวันที่สอบ</h5>
            <p className="card-text text-muted mb-0 small">Campaign และ Session การสอบ</p>
          </div>
          <ShowIfCan permission="manage_subjects">
            <button
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
              onClick={onCreateCampaign}
            >
              <Plus size={14} />
              สร้างแคมเปญใหม่
            </button>
          </ShowIfCan>
        </div>
      </div>

      <div className="card-body">
        <div className="row g-3">
          <div className="col-lg-6">
            <label
              htmlFor="search"
              className="form-label text-uppercase small text-muted mb-1"
            >
              ค้นหา
            </label>
            <div className="position-relative">
              <Search
                className="position-absolute"
                size={16}
                style={{
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--bs-secondary-color)",
                }}
              />
              <input
                id="search"
                className="form-control form-control-sm ps-5"
                value={textFilter}
                onChange={(e) => onTextFilterChange(e.target.value)}
                placeholder="ค้นหาแคมเปญ / เซสชัน / รายวิชา"
              />
            </div>
          </div>

          <div className="col-lg-3">
            <label
              htmlFor="date"
              className="form-label text-uppercase small text-muted mb-1"
            >
              วันที่สอบ
            </label>
            <input
              id="date"
              type="date"
              className="form-control form-control-sm"
              value={dateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
            />
          </div>

          <div className="col-12 col-lg-3">
            <div className="d-flex flex-wrap gap-2 justify-content-start justify-content-lg-end align-items-end">
              <button className="btn btn-outline-secondary btn-sm w-100 w-sm-auto" onClick={onResetFilters}>
                ล้างตัวกรอง
              </button>

              <span className="badge text-bg-light small d-inline-flex align-items-center gap-1">
                <CalendarDays size={12} />
                {sessionCount} เซสชัน
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

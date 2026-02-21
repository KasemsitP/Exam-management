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
        <div className="d-flex flex-column flex-lg-row gap-2 align-items-start align-items-lg-center justify-content-lg-between">
          <div>
            <h5 className="card-title mb-1 fs-6">จัดการรอบสอบ</h5>
            <p className="card-text text-muted mb-0 small">สร้างรอบสอบและวันที่สอบ</p>
          </div>
        </div>
      </div>

      <div className="card-body p-3">
        <div className="row g-2 g-md-3">
          <div className="col-12 col-md-6">
            <label
              htmlFor="search"
              className="form-label text-uppercase small text-muted mb-2"
            >
              ค้นหา
            </label>
<div className="d-flex flex-column flex-lg-row gap-2">
  <div className="position-relative flex-grow-1">
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
      placeholder="ค้นหารอบสอบ"
    />
  </div>

  <button
    className="btn btn-outline-secondary btn-sm"
    onClick={onResetFilters}
  >
    ล้างตัวกรอง
  </button>
</div>
          </div>

        </div>
      </div>
    </div>
  );
}

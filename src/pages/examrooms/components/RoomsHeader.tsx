// src/pages/exam/components/RoomsHeader.tsx
import { DoorOpen, Plus, Search } from "lucide-react";

interface RoomsHeaderProps {
  activeCampaign: any;
  searchTerm: string;
  onChangeSearch: (value: string) => void;
  onCreate: () => void;
  summary: {
    totalRooms: number;
    totalCapacity: number;
  };
}

export default function RoomsHeader({
  activeCampaign,
  searchTerm,
  onChangeSearch,
  onCreate,
  summary,
}: RoomsHeaderProps) {
  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <h5 className="mb-1 d-flex align-items-center gap-2">
            จัดการห้องสอบ
          </h5>
          <small className="text-muted">
            ความจุห้องสอบสำหรับแต่ละรอบสอบของแคมเปญ{" "}
            {activeCampaign?.name}
          </small>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {/* Search */}
          <div className="position-relative">
            <Search
              size={16}
              className="position-absolute"
              style={{
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              className="form-control ps-5"
              style={{ width: 220 }}
              value={searchTerm}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder="ค้นหาห้องสอบ"
            />
          </div>

          <button
            className="btn btn-primary d-inline-flex align-items-center gap-2"
            onClick={onCreate}
          >
            <Plus size={16} /> เพิ่มห้องสอบ
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="row g-3">
          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  จำนวนห้องสอบในรอบนี้
                </div>
                <div className="h3 mb-0">{summary.totalRooms}</div>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-lg-4">
            <div className="card shadow-none border">
              <div className="card-body">
                <div className="text-uppercase small text-muted mb-1">
                  ความจุรวม (คน)
                </div>
                <div className="h3 mb-0">
                  {summary.totalCapacity.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

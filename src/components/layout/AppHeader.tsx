import { CalendarDays, ChevronRight, LogOut, Menu } from "lucide-react";
import { ExamCampaign } from "@/store/slices/examData.slice";

interface AppHeaderProps {
  activeCampaign: ExamCampaign | null;
  onOpenCampaignModal: () => void;
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
  theme: { color: string; bg: string };
  onclickSidebar: string;
}

export function AppHeader({
  activeCampaign,
  onOpenCampaignModal,
  onLogout,
  onOpenMobileSidebar,
  onclickSidebar,
  theme,
}: AppHeaderProps) {
  const campaignLabel = activeCampaign
    ? `${activeCampaign.name ?? activeCampaign.id} - ${activeCampaign.code}`
    : null;

  return (
    <header
      className="bg-white px-3 px-md-4 d-flex justify-content-between align-items-center sticky-top border-bottom"
      style={{ height: 64 }}
    >
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm d-lg-none border"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          style={{ backgroundColor: theme.bg }} // <-- เปลี่ยนพื้นหลัง
        >
          <Menu size={20} className="text-secondary" />
        </button>

        <div className="d-flex flex-column justify-content-center">
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary small fw-medium d-none d-sm-inline">Console</span>
            <ChevronRight size={14} className="text-muted d-none d-sm-inline" />
            <h1 className="h6 mb-0">{onclickSidebar}</h1>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <div className="d-none d-md-flex align-items-center me-3">
          {activeCampaign ? (
            <div 
              className="d-flex align-items-center gap-3 px-4 py-2 rounded-pill border"
              style={{ backgroundColor: theme.bg }} // <-- เปลี่ยนพื้นหลัง
            >
              <span
                className={`badge rounded-circle ${activeCampaign.isActive ? "bg-success" : "bg-secondary"}`}
                style={{ width: 14, height: 14 }}
              />
              <span
                className="text-dark fw-semibold"
                style={{
                  maxWidth: 600,
                  fontSize: "1.1rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                รอบสอบ {campaignLabel}
              </span>
            </div>
          ) : (
            <span className="text-muted small fst-italic">ยังไม่ได้เลือกรอบสอบ</span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-sm d-flex align-items-center gap-2 transition-all hover-shadow-sm"
          style={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            color: "#374151",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          onClick={onOpenCampaignModal}
        >
          <CalendarDays size={16} className="text-primary" />
          <span className="d-none d-sm-inline fw-medium small">เปลี่ยนรอบสอบ</span>
        </button>

        <div
          className="vr mx-2 bg-secondary opacity-25 d-none d-sm-block"
          style={{ height: 24 }}
        ></div>

        <button
          type="button"
          className="btn btn-sm btn-light text-danger bg-danger bg-opacity-10 border-0 d-flex align-items-center gap-2 rounded-3 px-3"
          onClick={onLogout}
          title="ออกจากระบบ"
          style={{ height: 36 }}
        >
          <LogOut size={16} />
          <span className="d-none d-sm-inline fw-medium small">Logout</span>
        </button>
      </div>
    </header>
  );
}
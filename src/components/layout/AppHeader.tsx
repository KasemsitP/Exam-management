import { CalendarDays, ChevronRight, LogOut, Menu } from "lucide-react";
import { ExamCampaign } from "@/store/slices/examData.slice";
import type { Theme } from "./AppLayout";

interface AppHeaderProps {
  activeCampaign: ExamCampaign | null;
  onOpenCampaignModal: () => void;
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
  theme: Theme;
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
    ? `${activeCampaign.name ?? activeCampaign.campaign_size} `
    : null;

  return (
    <header
      className="px-3 px-md-4 d-flex justify-content-between align-items-center sticky-top shadow-sm"
      style={{
        height: 64,
        background: theme.headerGradient ?? theme.headerBg, // ✅ ใช้ gradient ถ้ามี
        borderBottom: `1px solid ${theme.border}`,
      }}
    >

      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm d-lg-none shadow-sm"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.color,
          }}
        >
          <Menu size={20} />
        </button>

        <div className="d-flex flex-column justify-content-center">
          <div className="d-flex align-items-center gap-2">
            <span className="small fw-medium d-none d-sm-inline" style={{ color: theme.textMuted }}>
              Console
            </span>
            <ChevronRight size={14} className="d-none d-sm-inline" style={{ color: theme.textMuted }} />
            <h1 className="h6 mb-0 fw-semibold" style={{ color: theme.text }}>
              {onclickSidebar}
            </h1>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <div className="d-none d-md-flex align-items-center me-3">
          {activeCampaign ? (
            <div
              className="d-flex align-items-center gap-3 px-4 py-2 rounded-pill shadow-sm"
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
              }}
            >
              <span
                className="rounded-circle"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: activeCampaign.isActive ? "#16A34A" : "#64748B",
                }}
              />
              <span
                className="fw-semibold"
                style={{
                  maxWidth: 600,
                  fontSize: "1rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: theme.text,
                }}
              >
                รอบสอบ {campaignLabel}
              </span>
            </div>
          ) : (
            <span className="small fst-italic" style={{ color: theme.textMuted }}>
              ยังไม่ได้เลือกรอบสอบ
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn btn-sm d-flex align-items-center gap-2 shadow-sm"
          style={{
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.text,
            borderRadius: 8,
            padding: "8px 16px",
          }}
          onClick={onOpenCampaignModal}
        >
          <CalendarDays size={16} style={{ color: theme.color }} />
          <span className="d-none d-sm-inline fw-medium small">เปลี่ยนรอบสอบ</span>
        </button>

        <div
          className="vr mx-2 d-none d-sm-block"
          style={{ height: 24, backgroundColor: theme.border, opacity: 1 }}
        />

        {/* ✅ Logout ไม่แดงสดแบบสนามเด็กเล่น — ใช้ neutral + border + icon muted red */}
        <button
          type="button"
          className="btn btn-sm d-flex align-items-center gap-2 rounded-3 px-3 shadow-sm"
          onClick={onLogout}
          title="ออกจากระบบ"
          style={{
            height: 36,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        >
          <LogOut size={16} style={{ color: "#9B1C1C" }} />
          <span className="d-none d-sm-inline fw-medium small">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}

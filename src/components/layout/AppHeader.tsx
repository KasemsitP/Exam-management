import { CalendarDays, ChevronRight, LogOut, Menu } from "lucide-react";
import { ExamCampaign } from "@/store/slices/examData.slice";
import type { Theme } from "@/components/layout/theme"

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

  // ✅ โทนพื้นของ element บน header (ไม่ใช้ขาวล้วน)
  const headerSurface = theme.cardBg; // tinted
  const headerBorder = theme.cardBorder ?? theme.border;

  return (
    <header
      className="px-3 px-md-4 d-flex justify-content-between align-items-center sticky-top"
      style={{
        height: 64,
        background: theme.headerGradient ?? theme.headerBg,
        borderBottom: `1px solid ${theme.border}`,
        // ✅ ทำให้ header ดู “มีชั้น” ไม่แบน
        boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 1030,
      }}
    >
      {/* ✅ เส้น role accent ด้านล่าง (ช่วยให้ role ชัดขึ้นทันที) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.color} 0%, transparent 70%)`,
          opacity: 0.9,
          pointerEvents: "none",
        }}
      />

      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm d-lg-none"
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          style={{
            background: headerSurface,
            border: `1px solid ${headerBorder}`,
            color: theme.text,
            boxShadow: "0 1px 4px rgba(15,23,42,0.06)",
          }}
        >
          <Menu size={20} />
        </button>

        <div className="d-flex flex-column justify-content-center">
          <div className="d-flex align-items-center gap-2">
            {/* ✅ role dot */}
            <span
              className="rounded-circle"
              style={{
                width: 9,
                height: 9,
                backgroundColor: theme.color,
                boxShadow: "0 0 0 3px rgba(255,255,255,0.8)",
              }}
            />
            <span
              className="small fw-medium d-none d-sm-inline"
              style={{ color: theme.textMuted }}
            >
              Console
            </span>
            <ChevronRight
              size={14}
              className="d-none d-sm-inline"
              style={{ color: theme.textMuted }}
            />
            <h1 className="h6 mb-0 fw-semibold" style={{ color: theme.text }}>
              {onclickSidebar || "Dashboard"}
            </h1>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <div className="d-none d-md-flex align-items-center me-3">
          {activeCampaign ? (
            <div
              className="d-flex align-items-center gap-3 px-4 py-2 rounded-pill"
              style={{
                background: headerSurface, // ✅ tinted แทน white
                border: `1px solid ${headerBorder}`,
                boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
              }}
            >
              <span
                className="rounded-circle"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: activeCampaign.isActive ? theme.success : theme.textMuted,
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
          className="btn btn-sm d-flex align-items-center gap-2"
          style={{
            background: headerSurface, // ✅ tinted
            border: `1px solid ${headerBorder}`,
            color: theme.text,
            borderRadius: 10,
            padding: "8px 14px",
            boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
          }}
          onClick={onOpenCampaignModal}
        >
          <CalendarDays size={16} style={{ color: theme.color }} />
          <span className="d-none d-sm-inline fw-medium small">เปลี่ยนรอบสอบ</span>
        </button>

        <div
          className="vr mx-2 d-none d-sm-block"
          style={{
            height: 24,
            backgroundColor: theme.border,
            opacity: 1,
          }}
        />

        {/* ✅ Logout ใช้ tinted + icon muted red */}
        <button
          type="button"
          className="btn btn-sm d-flex align-items-center gap-2 rounded-3 px-3"
          onClick={onLogout}
          title="ออกจากระบบ"
          style={{
            height: 36,
            background: headerSurface, // ✅ tinted
            border: `1px solid ${headerBorder}`,
            color: theme.text,
            boxShadow: "0 1px 6px rgba(15,23,42,0.05)",
          }}
        >
          <LogOut size={16} style={{ color: "#9B1C1C" }} />
          <span className="d-none d-sm-inline fw-medium small">ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}

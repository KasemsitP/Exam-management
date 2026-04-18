import { CalendarDays, ChevronRight, LogOut, Menu } from "lucide-react";
import { ExamCampaign } from "@/store/slices/examData.slice";
import type { Theme } from "@/components/layout/theme"
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hook";
import { NAV_ITEMS } from "@/components/layout/navItems";

interface AppHeaderProps {
  activeCampaign: ExamCampaign | null;
  onOpenCampaignModal: () => void;
  onLogout: () => void;
  onOpenMobileSidebar: () => void;
  theme: Theme;
  onclickSidebar: string;
}



// const pageTitleMap: Record<string, string> = {
//   "/home": "หน้าแรก",
//   "/dashboard": "แดชบอร์ด",
//   "/campaign-sessions": "รอบสอบ",
//   "/seat-allocation": "จัดที่นั่ง",
//   "/bags": "ถุงข้อสอบ",
//   "/import-csv": "นำเข้าข้อมูล",
//   "/keys": "จัดการกุญแจ",
//   "/sign-sheets": "ใบเซ็นชื่อ",
//   "/grading-station": "ตรวจข้อสอบ",
//   "/score-review": "ตรวจคะแนน",
//   "/accounts": "บัญชีผู้ใช้",
//   "/qrscanner": "สแกน QR",
//   "/subject": "วิชา",
//   "/graders": "ผู้ตรวจ",
//   "/admin-reset": "รีเซ็ตระบบ",
//   "/subject-ranking-export": "ส่งออกอันดับ",
//   "/settings": "ตั้งค่า",
//   "/grader-score-summary": "สรุปคะแนน",
//   "/active-bags": "ถุงที่กำลังใช้งาน",
// };

export function AppHeader({
  activeCampaign,
  onOpenCampaignModal,
  onLogout,
  onOpenMobileSidebar,
  onclickSidebar,
  theme,
}: AppHeaderProps) {
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.roles?.includes("admin");

  const pageTitle =
  NAV_ITEMS.find((item) => item.to === location.pathname)?.label ||
  "หน้าแรก";
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
        background: headerSurface ?? theme.headerBg,
        borderBottom: `1px solid ${theme.border}`,
        //  ทำให้ header ดู “มีชั้น” ไม่แบน
        boxShadow: "0 2px 10px rgba(15,23,42,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 1030,
      }}
    >
      {/*  เส้น role accent ด้านล่าง (ช่วยให้ role ชัดขึ้นทันที) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          // background: `linear-gradient(90deg, ${theme.color} 0%, transparent 70%)`,
          background: ` ${theme.color} `,
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
            background: theme.mainBg,
            border: `1.5px solid ${theme.border}`,
            color: theme.text,
            boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
          }}
        >
          <Menu size={20} />
        </button>

        <div className="d-flex flex-column justify-content-center border rounded-3 px-3 py-2 shadow-sm" style={{
          backgroundColor: theme.mainBg,
        }}>
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

            {/* Mobile: แสดงชื่อรอบสอบ */}
            <span
              className="small fw-medium d-sm-none"
              style={{ color: theme.textMuted, fontFamily: "monospace" }}
            >
              {activeCampaign ? campaignLabel : "ไม่มีรอบสอบ"}
            </span>

            {/* Desktop: แสดง Console */}
            <span
              className="small fw-medium d-none d-sm-inline"
              style={{ color: theme.textMuted, fontFamily: "monospace" }}
            >
            </span>

            <ChevronRight
              size={14}
              className="d-none d-sm-inline"
              style={{ color: theme.textMuted }}
            />
            {/* <h1 className="h6 mb-0 fw-semibold d-none d-sm-block" style={{ color: theme.text, fontFamily: "monospace" }}>
              {onclickSidebar || "หน้าแรก"}
            </h1> */}
            <h1
              className="h6 mb-0 fw-semibold d-none d-sm-block"
              style={{ color: theme.text, fontFamily: "monospace" }}
            >
              {pageTitle}
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
                background: theme.headerBg, // ✅ tinted แทน white
                border: `1.5px solid ${theme.border}`,
                boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
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
                  fontFamily: "monospace",
                }}
              >
                รอบสอบ {campaignLabel}
              </span>
            </div>
          ) : (
            <span className="small fst-italic" style={{ color: theme.textMuted, fontFamily: "monospace" }}>
              ยังไม่ได้เลือกรอบสอบ
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            type="button"
            disabled={!isAdmin}
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{
              background: theme.headerBg, // ใช้ขาวล้วนเพื่อเน้นให้ปุ่มเด่นขึ้น (เพราะเป็น action สำคัญ)
              border: `1.5px solid ${theme.border}`,
              color: theme.text,
              borderRadius: 10,
              padding: "8px 14px",
              boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
              opacity: isAdmin ? 1 : 0.5,
              cursor: isAdmin ? "pointer" : "not-allowed",
            }}
            onClick={isAdmin ? onOpenCampaignModal : undefined}
          >
            <CalendarDays size={16} style={{ color: theme.color }} />
            <span className="d-none d-sm-inline fw-medium small" style={{ fontFamily: "monospace" }}>
              เปลี่ยนรอบสอบ
            </span>
          </button>
        )}

        <div
          className="vr mx-2 d-none d-sm-block"
          style={{
            height: 24,
            backgroundColor: theme.border,
            opacity: 1,
          }}
        />

        {/*  Logout ใช้ tinted + icon muted red */}
        <button
          type="button"
          className="btn btn-sm d-flex align-items-center gap-2 rounded-3 px-3"
          onClick={onLogout}
          title="ออกจากระบบ"
          style={{
            height: 36,
            background: theme.headerBg, //  tinted
            border: `1.5px solid ${theme.border}`,
            color: theme.text,
            boxShadow: "0 2px 8px rgba(15,23,42,0.12)",
          }}
        >
          <LogOut size={16} style={{ color: "#9B1C1C" }} />
          <span className="d-none d-sm-inline fw-medium small" style={{ fontFamily: "monospace" }}>ออกจากระบบ</span>
        </button>
      </div>
    </header>
  );
}

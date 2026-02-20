// AppSidebar.tsx
import { X } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { NavItem } from "./navItems";
import type { AuthUser } from "@/store/slices/auth.slice";
import Logo from "../../assets/kmutnblogo.png";
import type { Theme } from "@/components/layout/theme";
import { useNavigate } from "react-router-dom";

interface AppSidebarProps {
  user: AuthUser | null;
  navItems: NavItem[];
  theme: Theme; // role accent
  mobile?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  setOnClickMobileSidebar?: (label: string) => void;
}

const SB = {
  // ✅ ไม่มีลายแล้ว (soft gradient เรียบๆ)
  bg: `linear-gradient(180deg, #F8FAFC 0%, #F3F4F6 100%)`,
  border: "rgba(15,23,42,0.12)",
  text: "#0F172A",
  muted: "#64748B",

  // hover/active ชัดขึ้นนิดนึง
  hover: "rgba(15,23,42,0.055)",
  active: "rgba(15,23,42,0.085)",

  activeBorder: "rgba(15,23,42,0.14)",
};

export function AppSidebar({
  user,
  navItems,
  theme,
  mobile = false,
  mobileOpen = false,
  onCloseMobile,
  setOnClickMobileSidebar,
}: AppSidebarProps) {
  const roleLabel: Record<string, string> = {
    admin: "ผู้ดูแลระบบ Admin",
    staff: "เจ้าหน้าที่ Staff",
    grader: "ผู้ตรวจข้อสอบ Grader",
    manager: "ผู้จัดการคีย์ Manager"
  };
  const navigate = useNavigate();
  const SidebarInner = (

    <>
      <style>{styleScrollbar}</style>

      <div className="d-flex flex-column h-100 sidebar-shell" style={{ background: SB.bg }}>
        {/* Logo / Title */}
        <div
          className="px-4 py-4 d-flex align-items-center position-relative"
          style={{
            height: 150,
            position: "sticky",
            top: 0,
            zIndex: 10,
            borderBottom: `1px solid ${SB.border}`,
            overflow: "hidden",
          }}
        >
          {/* ✅ Striped pattern background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `
                repeating-linear-gradient(
                  45deg,
                  ${theme.color}0D,
                  ${theme.color}0D 10px,
                  transparent 10px,
                  transparent 20px
                )
              `,
              opacity: 0.5,
              zIndex: 0,
            }}
          />

          {/* ✅ Base background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: SB.bg,
              zIndex: -1,
            }}
          />

          <div className="d-flex align-items-center gap-3 w-100 position-relative" style={{ zIndex: 1 }}>
            <div className="px-0 d-flex align-items-center w-100 flex-column text-center">
              <img
                src={Logo}
                alt="Logo"
                style={{ width: 96, height: "auto", position: "relative", zIndex: 2, cursor: "pointer" }}
                onClick={() => navigate("/home")}
              />
              <h2
                className="h6 mb-0 fw-bold mt-2 font-monospace"
                style={{ fontSize: "1.05rem", color: SB.text, letterSpacing: 0.2, position: "relative", zIndex: 2 }}
              >
                ระบบจัดการข้อสอบ
              </h2>

              {/* ✅ เส้นคั่นเบาๆ ดู clean */}
              <div
                style={{
                  marginTop: 10,
                  height: 1,
                  width: "70%",
                  background: `linear-gradient(90deg, transparent, ${SB.border}, transparent)`,
                  position: "relative",
                  zIndex: 2,
                }}
              />
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="flex-grow-1 px-3 py-2 sidebar-scroll">
          <p
            className="px-3 mb-2 mt-2 small text-uppercase fw-bold"
            style={{
              fontSize: "0.78rem",
              letterSpacing: "1.4px",
              color: SB.muted,
            }}
          >
            Menu จัดการสอบ
          </p>

          <nav className="d-flex flex-column gap-1">
            {navItems
              .filter((item) => item.notRequiredCampaignActive)
              .map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      "d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none sidebar-item",
                      isActive ? "fw-semibold is-active" : "",
                    ].join(" ")
                  }
                  style={({ isActive }) => ({
                    background: isActive ? SB.active : "transparent",
                    color: SB.text,
                    border: `1px solid ${isActive ? SB.activeBorder : "transparent"
                      }`,
                    borderLeft: isActive
                      ? `4px solid ${theme.color}`
                      : "4px solid transparent",
                    boxShadow: isActive
                      ? "0 1px 0 rgba(255,255,255,0.7) inset"
                      : "none",
                  })}
                  onClick={() => {
                    setOnClickMobileSidebar?.(label);
                    mobile && onCloseMobile?.();
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={16}
                        strokeWidth={2}
                        style={{
                          color: theme.color,
                          opacity: isActive ? 1 : 0.78,
                        }}
                      />
                      <span className="menu-title" style={{ color: SB.text }}>
                        {label}
                      </span>

                      {isActive && (
                        <div
                          className="ms-auto rounded-circle"
                          style={{
                            width: 7,
                            height: 7,
                            background: theme.color,
                            boxShadow: "0 0 0 3px rgba(255,255,255,0.75)",
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}

            <div className="my-2" style={{ borderTop: `1px solid ${SB.border}` }} />

            <p
              className="px-3 mb-2 small text-uppercase fw-bold"
              style={{
                fontSize: "0.78rem",
                letterSpacing: "1.4px",
                color: SB.muted,
              }}
            >
              Menu จัดการภายในรอบสอบ
            </p>

            {navItems
              .filter((item) => !item.notRequiredCampaignActive)
              .map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      "d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none sidebar-item",
                      isActive ? "fw-semibold is-active" : "",
                    ].join(" ")
                  }
                  style={({ isActive }) => ({
                    background: isActive ? SB.active : "transparent",
                    color: SB.text,
                    border: `1px solid ${isActive ? SB.activeBorder : "transparent"
                      }`,
                    borderLeft: isActive
                      ? `4px solid ${theme.color}`
                      : "4px solid transparent",
                    boxShadow: isActive
                      ? "0 1px 0 rgba(255,255,255,0.7) inset"
                      : "none",
                  })}
                  onClick={() => {
                    setOnClickMobileSidebar?.(label);
                    mobile && onCloseMobile?.();
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={16}
                        strokeWidth={2}
                        style={{
                          color: theme.color,
                          opacity: isActive ? 1 : 0.78,
                        }}
                      />
                      <span className="menu-title" style={{ color: SB.text }}>
                        {label}
                      </span>

                      {isActive && (
                        <div
                          className="ms-auto rounded-circle"
                          style={{
                            width: 7,
                            height: 7,
                            background: theme.color,
                            boxShadow: "0 0 0 3px rgba(255,255,255,0.75)",
                          }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
          </nav>
        </div>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: `1px solid ${SB.border}` }}>
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{
                width: 46,
                height: 46,
                background: `linear-gradient(180deg, ${theme.color}, ${theme.accent ?? theme.color})`,
                color: "#fff",
                fontSize: "1.1rem",
              }}
            >
              {user?.name?.charAt(0) ?? "A"}
            </div>

            <div className="overflow-hidden">
              <p
                className="mb-0 fw-bold text-truncate"
                style={{ fontSize: "0.92rem", color: SB.text }}
              >

                {roleLabel[user?.roles?.[0]]}
              </p>
              <p
                className="mb-0 small text-truncate"
                style={{ fontSize: "0.8rem", color: SB.muted }}
              >
                {user?.name || "admin"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Desktop Sidebar
  if (!mobile) {
    return (
      <aside
        className="d-none d-lg-flex flex-column border-end position-sticky top-0"
        style={{
          width: 280,
          minWidth: 280,
          flexShrink: 0,
          height: "100vh",
          zIndex: 1020,
          borderColor: SB.border,
          background: SB.bg,
        }}
      >
        {SidebarInner}
      </aside>
    );
  }

  // Mobile drawer
  return (
    <>
      <div
        className="d-lg-none position-fixed top-0 start-0 h-100 shadow-lg"
        style={{
          width: 280,
          zIndex: 1060,
          transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          background: SB.bg,
        }}
        aria-hidden={!mobileOpen}
      >
        <div className="position-relative h-100">
          <button
            className="btn btn-sm btn-light position-absolute top-0 end-0 m-3 shadow-sm border"
            onClick={onCloseMobile}
            style={{ zIndex: 1070 }}
          >
            <X size={18} />
          </button>

          {SidebarInner}
        </div>
      </div>

      {mobileOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{
            background: "rgba(0,0,0,0.28)",
            backdropFilter: "blur(2px)",
            zIndex: 1050,
          }}
          onClick={onCloseMobile}
        />
      )}
    </>
  );
}

const styleScrollbar = `
.sidebar-scroll { overflow-y: auto; }

@media (min-width: 992px) {
  .sidebar-scroll { overflow: hidden; }
  .sidebar-scroll:hover { overflow-y: auto; }
}

.sidebar-scroll::-webkit-scrollbar { width: 6px; }
.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(15,23,42,0.18);
  border-radius: 3px;
}
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }

.sidebar-item {
  transition: background 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}
.sidebar-item:hover { background: rgba(15,23,42,0.055) !important; }
.sidebar-item:active { transform: translateY(0.5px); }
`;

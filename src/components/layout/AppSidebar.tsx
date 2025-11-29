import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import type { NavItem } from "./navItems";
import type { AuthUser } from "@/store/slices/auth.slice";

const THEME_COLOR = "#6366f1";
const THEME_BG_ACTIVE = "#e0e7ff";

interface AppSidebarProps {
  user: AuthUser | null;
  navItems: NavItem[];
  mobile?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AppSidebar({
  user,
  navItems,
  mobile = false,
  mobileOpen = false,
  onCloseMobile,
}: AppSidebarProps) {
  const SidebarInner = (
    <div className="d-flex flex-column h-100 bg-white">
      {/* Logo / Title */}
      <div className="px-4 py-4 d-flex align-items-center" style={{ height: "80px" }}>
        <div className="d-flex align-items-center gap-3">
          <div className="px-0 d-flex align-items-center">
            <div>
              <h2 className="h6 mb-0 fw-bold text-dark" style={{ fontSize: "1.1rem" }}>
                ระบบจัดการข้อสอบ
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-grow-1 overflow-auto px-3 py-2 custom-scrollbar">
        <p
          className="px-3 mb-2 small text-muted text-uppercase fw-bold"
          style={{ fontSize: "0.7rem", letterSpacing: "1.5px", color: "#9ca3af" }}
        >
          Menu
        </p>

        <nav className="d-flex flex-column gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none",
                  isActive ? "fw-semibold" : "text-secondary",
                ].join(" ")
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? THEME_BG_ACTIVE : "transparent",
                color: isActive ? THEME_COLOR : "#4b5563",
              })}
              onClick={() => mobile && onCloseMobile?.()}
            >
              {({ isActive }) => (
                <>
                  <Icon size={14} strokeWidth={2} style={{ opacity: isActive ? 1 : 0.8 }} />
                  <div className="text-wrap">
                    <span className="menu-title">{label}</span>
                  </div>
                  {isActive && (
                    <div
                      className="ms-auto rounded-circle"
                      style={{ width: 6, height: 6, backgroundColor: THEME_COLOR }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User footer */}
      <div className="p-4 border-top mt-auto">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-secondary fw-bold shadow-sm"
            style={{ width: 48, height: 48, backgroundColor: "#e5e7eb", fontSize: "1.2rem" }}
          >
            {user?.name?.charAt(0) ?? "A"}
          </div>
          <div className="overflow-hidden">
            <p className="mb-0 text-dark fw-bold text-truncate" style={{ fontSize: "0.95rem" }}>
              {user?.name ?? "Admin User"}
            </p>
            <p className="mb-0 text-muted small text-truncate" style={{ fontSize: "0.8rem" }}>
              {user?.username || "admin"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mobile) {
    // desktop sidebar
    return (
      <aside
        className="d-none d-lg-flex flex-column text-dark bg-white border-end position-sticky top-0"
        style={{ width: 280, height: "100vh", zIndex: 1020 }}
      >
        {SidebarInner}
      </aside>
    );
  }

  // mobile drawer
  return (
    <>
      <div
        className="d-lg-none position-fixed top-0 start-0 h-100 bg-white shadow-lg"
        style={{
          width: 280,
          zIndex: 1060,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
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
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", zIndex: 1050 }}
          onClick={onCloseMobile}
        />
      )}
    </>
  );
}

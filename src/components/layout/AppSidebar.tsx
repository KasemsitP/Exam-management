import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import type { NavItem } from "./navItems";
import type { AuthUser } from "@/store/slices/auth.slice";
import Logo from "../../assets/kmutnblogo.png";
import type { Role } from "@/store/slices/auth.slice";
import { set } from "react-hook-form";

const ROLE_THEMES: Record<Role | "DEFAULT", { color: string; bg: string }> = {
admin: {
  color: "#6b5cff", // ม่วงอ่อน อ่านชัด
  bg: "#f4f3ff",    // ม่วงพาสเทล
},

manager: {
  color: "#3b82f6", // ฟ้าอ่อน สุภาพ
  bg: "#eff6ff",    // ฟ้าขาว
},

staff: {
  color: "#0d9488", // เขียวอมฟ้าอ่อน
  bg: "#ecfdf5",    // เขียวพาสเทลมาก
},

grader: {
  color: "#f59e0b", // ส้มอ่อน ไม่แสบตา
  bg: "#fffbeb",    // ครีมเหลือง
},

DEFAULT: {
  color: "#64748b", // เทาอมฟ้า อ่านง่าย
  bg: "#f8fafc",    // ขาวนวล
},

};

interface AppSidebarProps {
  user: AuthUser | null;
  navItems: NavItem[];
  mobile?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  setOnClickMobileSidebar?: (label: string) => void;
}

export function AppSidebar({
  user,
  navItems,
  mobile = false,
  mobileOpen = false,
  onCloseMobile,
  setOnClickMobileSidebar,
}: AppSidebarProps) {
  const theme = useMemo(() => {
    const roles = user?.roles ?? [];

    const hasRole = (role: Role) => roles.includes(role);

    if (hasRole("admin")) return ROLE_THEMES.admin;

    if (hasRole("manager") || hasRole("staff"))
      return ROLE_THEMES.manager;

    if (hasRole("grader")) return ROLE_THEMES.grader;
    if (hasRole("staff")) return ROLE_THEMES.staff;

    return ROLE_THEMES.DEFAULT;
  }, [user?.roles]);

  const SidebarInner = (
    <>
      <style>{styleScrollbar}</style>
      {/* 🔴 1. เปลี่ยนพื้นหลังของ Sidebar ทั้งหมดเป็นสีอ่อนของ Role นั้นๆ */}
      <div className="d-flex flex-column h-100" style={{ backgroundColor: theme.bg }}>
        
        {/* Logo / Title */}
        <div
          className="px-4 py-4 d-flex align-items-center"
          style={{
            height: "150px",
            position: "sticky",
            top: 0,
            zIndex: 10,
            // เปลี่ยนสีเส้นขอบให้เป็นสีเข้มแบบจางๆ
            borderBottom: `1px solid ${theme.color}33`, 
          }}
        >
          <div className="d-flex align-items-center gap-3 w-100">
            <div className="px-0 d-flex align-items-center w-100 flex-column text-center">
              <img src={Logo} alt="Logo" style={{ width: 100, height: "auto" }} />
              {/* 🔴 2. เปลี่ยนสีข้อความชื่อระบบ เป็นสีเข้มของ Role */}
              <h2 className="h6 mb-0 fw-bold mt-2" style={{ fontSize: "1.1rem", color: theme.color }}>
                ระบบจัดการข้อสอบ
              </h2>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="flex-grow-1 px-3 py-2 custom-scrollbar sidebar-scroll">
          <p
            className="px-3 mb-2 mt-2 small text-uppercase fw-bold"
            // 🔴 3. เปลี่ยนสีหัวข้อเมนู (Menu Title)
            style={{ fontSize: "0.8rem", letterSpacing: "1.5px", color: theme.color, opacity: 0.7 }}
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
                      "d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none transition-all",
                      isActive ? "fw-semibold shadow-sm" : "",
                    ].join(" ")
                  }
                  // 🔴 4. ปรับสีปุ่ม: ถ้าเลือกอยู่ ให้พื้นหลังเข้ม/ตัวหนังสือขาว, ถ้ายังไม่เลือกให้เป็นสีเข้มของ Role
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? theme.color : "transparent",
                    color: isActive ? "#ffffff" : theme.color,
                  })}

                  onClick={() => {
                    setOnClickMobileSidebar?.(label);
                    mobile && onCloseMobile?.()
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={14} strokeWidth={2} style={{ opacity: isActive ? 1 : 0.8 }} />
                      <div className="text-wrap">
                        <span className="menu-title">{label}</span>
                      </div>
                      {isActive && (
                        <div
                          className="ms-auto rounded-circle bg-white"
                          style={{ width: 6, height: 6 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}

            {/* เส้นแบ่ง */}
            <div className="my-2" style={{ borderTop: `1px solid ${theme.color}33` }} />
            <p
              className="px-3 mb-2 small text-uppercase fw-bold"
              style={{ fontSize: "0.8rem", letterSpacing: "1.5px", color: theme.color, opacity: 0.7 }}
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
                      "d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none transition-all",
                      isActive ? "fw-semibold shadow-sm" : "",
                    ].join(" ")
                  }
                  style={({ isActive }) => ({
                    backgroundColor: isActive ? theme.color : "transparent",
                    color: isActive ? "#ffffff" : theme.color,
                  })}
                  onClick={() => {
                    setOnClickMobileSidebar?.(label);
                    mobile && onCloseMobile?.()
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={14} strokeWidth={2} style={{ opacity: isActive ? 1 : 0.8 }} />
                      <div className="text-wrap">
                        <span className="menu-title">{label}</span>
                      </div>
                      {isActive && (
                        <div
                          className="ms-auto rounded-circle bg-white"
                          style={{ width: 6, height: 6 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
          </nav>
        </div>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: `1px solid ${theme.color}33` }}>
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
              // 🔴 5. สีไอคอน User
              style={{
                width: 48,
                height: 48,
                backgroundColor: theme.color,
                color: "#ffffff",
                fontSize: "1.2rem"
              }}
            >
              {user?.name?.charAt(0) ?? "A"}
            </div>
            <div className="overflow-hidden">
              <p className="mb-0 fw-bold text-truncate" style={{ fontSize: "0.95rem", color: theme.color }}>
                {user?.name ?? "Admin User"}
              </p>
              <p className="mb-0 small text-truncate" style={{ fontSize: "0.8rem", color: theme.color, opacity: 0.7 }}>
                {user?.username || "admin"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

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
          borderColor: `${theme.color}33`, // ขอบกลืนไปกับธีม
        }}
      >
        {SidebarInner}
      </aside>
    );
  }

  // mobile drawer ... (โค้ดส่วนนี้เหมือนเดิม แค่เอา bg-white ออก)
  return (
    <>
      <div
        className="d-lg-none position-fixed top-0 start-0 h-100 shadow-lg"
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


const styleScrollbar = `
/* เริ่มต้นซ่อน scroll */
.sidebar-scroll {
  overflow: hidden;
}

/* hover บน desktop ให้ scroll ปรากฏ */
@media (min-width: 992px) { /* lg ขึ้นไป = desktop */
  .sidebar-scroll:hover {
    overflow-y: auto;
  }
}

/* Custom scrollbar */
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: rgb(170,170,170);
  border-radius: 3px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
/* บน Mobile ให้ scroll ได้ตลอดเวลา */
.sidebar-scroll {
  overflow-y: auto;
}

/* บน Desktop (lg ขึ้นไป) ให้ซ่อนไว้ก่อนแล้วค่อยโชว์ตอน hover */
@media (min-width: 992px) { 
  .sidebar-scroll {
    overflow: hidden;
  }
  .sidebar-scroll:hover {
    overflow-y: auto;
  }
}

/* Custom scrollbar */
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1); /* ปรับให้จางลงหน่อยเพื่อความสวยงาม */
  border-radius: 3px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
`;
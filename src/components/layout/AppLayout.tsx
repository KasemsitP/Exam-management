import { Outlet } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { logout, selectCurrentUser } from "@/store/slices/auth.slice";
import {
  campaignSelected,
  fetchInitialExamData,
  selectActiveCampaign,
  selectCampaigns,
  selectExamDataStatus,
} from "@/store/slices/examData.slice";
import { canAny } from "@/lib/rbac";

import { NAV_ITEMS } from "./navItems";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { CampaignPickerModal } from "./CampaignPickerModal";
import { showSuccess } from "../ui/successAlert";

// 🔴 Import Role type
import type { Role } from "@/store/slices/auth.slice";

export type Theme = {
  color: string;          // role accent
  accent: string;
  headerBg: string;       // fallback
  headerGradient?: string;
  mainBg: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  // Properties ที่เพิ่มเข้ามาใหม่
  cardBg: string;
  cardBorder: string;
  buttonPrimary: string;
  buttonPrimaryHover: string;
  success: string;
  warning: string;
  error: string;
};

export const UNIVERSAL_SIDEBAR = {
  sidebarBg: "#ffffff",
  sidebarBorder: "#E5E7EB",
  sidebarText: "#111827",
  sidebarMuted: "#6B7280",
  sidebarHover: "#F3F4F6",
};

export const BASE: Omit<Theme, 'color' | 'accent' | 'headerGradient'> = {
  headerBg: "#FFFFFF",
  mainBg: "#F9FAFB",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  textMuted: "#6B7280",
  // เพิ่ม default values สำหรับ properties ใหม่
  cardBg: "#FFFFFF",
  cardBorder: "#F3F4F6",
  buttonPrimary: "#6B7280",
  buttonPrimaryHover: "#4B5563",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
};

const makeRoleHeaderGradient = (roleColor: string) =>
  `linear-gradient(180deg, ${roleColor}08 0%, ${roleColor}02 100%)`;

const SURFACE_BG = "#FFFFFF";

export const ROLE_THEMES: Record<Role | "DEFAULT", Theme> = {
  admin: {
    ...BASE,
    color: "#2563EB",
    accent: "#1D4ED8",
    headerBg: SURFACE_BG,
    headerGradient: makeRoleHeaderGradient("#2563EB"),
    mainBg: "#F0F9FF",
    cardBg: "#FFFFFF",
    cardBorder: "#DBEAFE",
    buttonPrimary: "#2563EB",
    buttonPrimaryHover: "#1D4ED8",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
  },
  manager: {
    ...BASE,
    color: "#7C3AED",
    accent: "#6D28D9",
    headerBg: SURFACE_BG,
    headerGradient: makeRoleHeaderGradient("#7C3AED"),
    mainBg: "#F5F3FF",
    cardBg: "#FFFFFF",
    cardBorder: "#EDE9FE",
    buttonPrimary: "#7C3AED",
    buttonPrimaryHover: "#6D28D9",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
  },
  staff: {
    ...BASE,
    color: "#0D9488",
    accent: "#0F766E",
    headerBg: SURFACE_BG,
    headerGradient: makeRoleHeaderGradient("#0D9488"),
    mainBg: "#F0FDFA",
    cardBg: "#FFFFFF",
    cardBorder: "#CCFBF1",
    buttonPrimary: "#0D9488",
    buttonPrimaryHover: "#0F766E",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
  },
  grader: {
    ...BASE,
    color: "#EA580C",
    accent: "#C2410C",
    headerBg: SURFACE_BG,
    headerGradient: makeRoleHeaderGradient("#EA580C"),
    mainBg: "#FFF7ED",
    cardBg: "#FFFFFF",
    cardBorder: "#FFEDD5",
    buttonPrimary: "#EA580C",
    buttonPrimaryHover: "#C2410C",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
  },
  DEFAULT: {
    ...BASE,
    color: "#6B7280",
    accent: "#4B5563",
    headerBg: SURFACE_BG,
    headerGradient: "none",
    mainBg: "#F9FAFB",
    cardBg: "#FFFFFF",
    cardBorder: "#F3F4F6",
    buttonPrimary: "#6B7280",
    buttonPrimaryHover: "#4B5563",
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
  },
};

// Utility functions สำหรับใช้งานสีใน components อื่น
export const getRoleColor = (role: Role): string => {
  return ROLE_THEMES[role]?.color || ROLE_THEMES.DEFAULT.color;
};

export const getRoleTheme = (role: Role): Theme => {
  return ROLE_THEMES[role] || ROLE_THEMES.DEFAULT;
};

export function AppLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const campaigns = useAppSelector(selectCampaigns);
  const examDataStatus = useAppSelector(selectExamDataStatus);
  const roles = user?.roles ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [onClickMobileSidebar, setOnClickMobileSidebar] = useState("");

  useEffect(() => {
    console.log("ad", onClickMobileSidebar);
  }, [onClickMobileSidebar]);

  // Theme calculation logic
  const theme = useMemo(() => {
    const roles = user?.roles ?? [];
    const hasRole = (role: Role) => roles.includes(role);

    if (hasRole("admin")) return ROLE_THEMES.admin;
    if (hasRole("manager")) return ROLE_THEMES.manager;
    if (hasRole("staff")) return ROLE_THEMES.staff;
    if (hasRole("grader")) return ROLE_THEMES.grader;

    return ROLE_THEMES.DEFAULT;
  }, [user?.roles]);

  useEffect(() => {
    if (examDataStatus === "idle") {
      dispatch(fetchInitialExamData());
    }
  }, [dispatch, examDataStatus]);

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAny(roles, item.permissions ?? [])),
    [roles]
  );

  const handleLogout = async () => {
    dispatch(logout());
    await showSuccess("ออกจากระบบสำเร็จ", "ออกจากระบบ");
    window.location.reload();
  };

  const handleSelectCampaign = (campaignId: number) => {
    dispatch(campaignSelected(String(campaignId)));
    setModalOpen(false);
  };

  return (
    <div className="d-flex min-vh-100 font-sans app-compact" style={{ background: theme.mainBg }}>
      {/* Desktop Sidebar */}
      <AppSidebar
        user={user}
        navItems={allowedNavItems}
        theme={theme}
        setOnClickMobileSidebar={setOnClickMobileSidebar}
      />

      {/* Mobile Sidebar */}
      <AppSidebar
        user={user}
        navItems={allowedNavItems}
        theme={theme}
        mobile
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        setOnClickMobileSidebar={setOnClickMobileSidebar}
      />

      {/* Main area */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{ backgroundColor: theme.mainBg, minWidth: 0 }}
      >
        {/* AppHeader with theme */}
        <AppHeader
          onclickSidebar={onClickMobileSidebar}
          activeCampaign={activeCampaign ?? null}
          onOpenCampaignModal={() => setModalOpen(true)}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          theme={theme}
        />

        <main className="flex-grow-1 overflow-auto p-2 p-sm-3 p-lg-4">
          <Outlet />
        </main>
      </div>

      <CampaignPickerModal
        open={modalOpen}
        campaigns={campaigns}
        activeCampaignId={activeCampaign ? Number(activeCampaign.id) : null}
        onClose={() => setModalOpen(false)}
        onConfirm={handleSelectCampaign}
      />
    </div>
  );
}

export default AppLayout;
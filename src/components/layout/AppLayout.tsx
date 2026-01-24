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

// 🔴 1. Import Role type (ปรับ path ให้ตรงกับโปรเจกต์ของคุณ)
import type { Role } from "@/store/slices/auth.slice";

// 🔴 2. ย้าย Config สีมาไว้ที่นี่ หรือจะแยกเป็นไฟล์ constants.ts ก็ได้
const ROLE_THEMES: Record<Role | "DEFAULT", { color: string; bg: string }> = {
  admin: { color: "#7c3aed", bg: "#f3e8ff" },
  manager: { color: "#0284c7", bg: "#e0f2fe" },
  staff: { color: "#0f766e", bg: "#ccfbf1" },
  grader: { color: "#d97706", bg: "#fef3c7" },
  DEFAULT: { color: "#6366f1", bg: "#e0e7ff" },
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

  // 🔴 3. ย้าย Logic การคำนวณ Theme มาไว้ที่ Layout
  const theme = useMemo(() => {
    const hasRole = (role: Role) => roles.includes(role);

    if (hasRole("admin")) return ROLE_THEMES.admin;
    if (hasRole("manager") || hasRole("staff")) return ROLE_THEMES.manager;
    if (hasRole("grader")) return ROLE_THEMES.grader;
    if (hasRole("staff")) return ROLE_THEMES.staff;

    return ROLE_THEMES.DEFAULT;
  }, [roles]);

  useEffect(() => {
    if (examDataStatus === "idle") {
      dispatch(fetchInitialExamData());
    }
  }, [dispatch, examDataStatus]);

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAny(roles, item.permissions ?? [])),
    [roles]
  );

  const handleLogout = () => {
    dispatch(logout());
    showSuccess("ออกจากระบบสำเร็จ", "ออกจากระบบ");
  };

  const handleSelectCampaign = (campaignId: number) => {
    dispatch(campaignSelected(String(campaignId)));
    setModalOpen(false);
  };

  return (
    <div className="d-flex min-vh-100 font-sans bg-light app-compact">
      {/* Desktop Sidebar (ถ้าใน AppSidebar ใช้ user.roles คำนวณเองอยู่แล้ว ก็ไม่ต้องส่ง prop เพิ่ม) */}
      <AppSidebar user={user} navItems={allowedNavItems} setOnClickMobileSidebar={setOnClickMobileSidebar}/>

      {/* Mobile Sidebar */}
      <AppSidebar
        user={user}
        navItems={allowedNavItems}
        mobile
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        setOnClickMobileSidebar={setOnClickMobileSidebar}
      />

      {/* Main area */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{ backgroundColor: "#f9fafb", minWidth: 0 }}
      >
        {/* 🔴 4. ส่งค่าสี theme ไปให้ AppHeader */}
        <AppHeader
          onclickSidebar={onClickMobileSidebar}
          activeCampaign={activeCampaign ?? null}
          onOpenCampaignModal={() => setModalOpen(true)}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          theme={theme} // <--- เพิ่ม Prop นี้
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
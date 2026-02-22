// AppLayout.tsx
import { Outlet, useNavigate } from "react-router-dom";
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
import { OverlayLoader } from "@/components/ui/Loading";
import type { Role } from "@/store/slices/auth.slice";
import { buildThemeByRole, pickRoleKey } from "@/components/layout/theme"
import { Suspense } from "react";


/* =========================================================
 * Build theme by Role (ชัดเจนตาม Role)
 * ======================================================= */

/* =========================================================
 * Utilities
 * ======================================================= */

const ContentFallback = () => (
  <div
    style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
    }}
  >
    <div
      style={{
        width: 24,
        height: 24,
        border: "3px solid #dee2e6",
        borderTop: "3px solid #6c757d",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />

    <span style={{ fontSize: 13, color: "#6c757d" }}>
      กำลังโหลด...
    </span>

    <style>
      {`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);
/* =========================================================
 * AppLayout
 * ======================================================= */
export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate(); // 2. เรียกใช้งาน hook

  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const campaigns = useAppSelector(selectCampaigns);
  const examDataStatus = useAppSelector(selectExamDataStatus);
  const roles = user?.roles ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [onClickMobileSidebar, setOnClickMobileSidebar] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // role pick (priority)
  const roleKey = useMemo<Role | "DEFAULT">(() => {
    const has = (r: Role) => roles.includes(r);
    if (has("admin")) return "admin";
    if (has("manager")) return "manager";
    if (has("staff")) return "staff";
    if (has("grader")) return "grader";
    return "DEFAULT";
  }, [roles]);

  // ✅ Theme ตาม Role อย่างเดียว
  const theme = useMemo(() => buildThemeByRole(roleKey), [roleKey]);

  useEffect(() => {
    if (examDataStatus === "idle") {
      dispatch(fetchInitialExamData());
    }
  }, [dispatch, examDataStatus]);

  // Track initial loading status
  useEffect(() => {
    if (examDataStatus === "succeeded" || examDataStatus === "failed") {
      setIsInitialLoading(false);
    }
  }, [examDataStatus]);

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAny(roles, item.permissions ?? [])),
    [roles]
  );

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } finally {
      // 3.  เอา await ออก! ให้ Alert ยิงขึ้นมาโชว์โดยไม่ต้องรอคิว
      showSuccess("ออกจากระบบสำเร็จ", "ออกจากระบบ");

      // 4. ✅ ใช้ navigate แทน window.location.href
      // { replace: true } จะลบประวัติการกด Back ป้องกันไม่ให้ผู้ใช้กด ถอยหลัง กลับมาหน้า Dashboard ได้อีก
      navigate("/", { replace: true });
    }
  };

  const handleSelectCampaign = (campaignId: number) => {
    dispatch(campaignSelected(String(campaignId)));
    setModalOpen(false);
  };

  // Show loading overlay while initial data is loading
  if (isInitialLoading) {
    return <OverlayLoader open={true} label="" />;
  }

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
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <AppHeader
          onclickSidebar={onClickMobileSidebar}
          activeCampaign={activeCampaign ?? null}
          onOpenCampaignModal={() => setModalOpen(true)}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          theme={theme}
        />

        <main className="flex-grow-1 overflow-auto p-2 p-sm-3 p-lg-4">
          <Suspense fallback={<ContentFallback />}>
            <Outlet />
          </Suspense>
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

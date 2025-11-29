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

export function AppLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const campaigns = useAppSelector(selectCampaigns);
  const examDataStatus = useAppSelector(selectExamDataStatus);
  const roles = user?.roles ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (examDataStatus === "idle") {
      dispatch(fetchInitialExamData());
    }
  }, [dispatch, examDataStatus]);

  const allowedNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => canAny(roles, item.permissions ?? [])),
    [roles]
  );

  const handleLogout = () => dispatch(logout());

  const handleSelectCampaign = (campaignId: number) => {
    dispatch(campaignSelected((String(campaignId))));
    setModalOpen(false);
  };

  return (
    <div className="d-flex min-vh-100 font-sans bg-light">
      {/* Desktop Sidebar */}
      <AppSidebar user={user} navItems={allowedNavItems} />

      {/* Mobile Sidebar */}
      <AppSidebar
        user={user}
        navItems={allowedNavItems}
        mobile
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex-grow-1 d-flex flex-column" style={{ backgroundColor: "#f9fafb" }}>
        <AppHeader
          activeCampaign={activeCampaign ?? null}
          onOpenCampaignModal={() => setModalOpen(true)}
          onLogout={handleLogout}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-grow-1 overflow-auto p-3 p-md-4">
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

      <style>{`
        .font-sans { font-family: 'Sarabun', 'Inter', sans-serif; }
        .hover-bg-light:hover { background-color: #f9fafb; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 10px; }
        .hover-shadow-sm:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-color: #d1d5db !important; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

export default AppLayout;

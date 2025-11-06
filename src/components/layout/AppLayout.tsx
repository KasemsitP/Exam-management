import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  ClipboardCheck,
  HandCoins,
  PackageCheck,
  DownloadCloud,
  KeyRound,
  FilePenLine,
  Users,
  GraduationCap,
  Search as SearchIcon,
  LogOut,
  Menu,
  X,
  QrCode,
} from "lucide-react";
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

// ---------------- UI config ----------------
const NAV_ITEMS = [
  { to: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { to: "/campaign-sessions", label: "จัดการรอบสอบ", icon: CalendarDays },
  { to: "/seat-allocation", label: "จัดที่นั่งสอบ", icon: FolderKanban },
  { to: "/exam-rooms", label: "ห้องสอบ", icon: ClipboardCheck },
  { to: "/bags", label: "ถุงข้อสอบ", icon: PackageCheck },
  { to: "/bag-handover", label: "ส่งมอบถุง", icon: HandCoins },
  { to: "/import-csv", label: "นำเข้าข้อมูล", icon: DownloadCloud },
  { to: "/keys", label: "รหัสผ่าน / คีย์", icon: KeyRound },
  { to: "/sign-sheets", label: "ใบบันทึกการสอบ", icon: FilePenLine },
  { to: "/grading-station", label: "บันทึกคะแนน", icon: GraduationCap },
  { to: "/score-review", label: "ใบสรุปคะแนน", icon: ClipboardCheck },
  { to: "/user-search", label: "ค้นหาผู้ใช้", icon: SearchIcon },
  { to: "/accounts", label: "จัดการบัญชีผู้ใช้", icon: Users },
  { to: "/qrscanner", label: "สแกนคิวอาร์โค้ด", icon: QrCode },
];

export function AppLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const campaigns = useAppSelector(selectCampaigns);
  const examDataStatus = useAppSelector(selectExamDataStatus);

  const [modalOpen, setModalOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // NEW: mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const campaignLabel = activeCampaign
    ? `${activeCampaign.code ?? activeCampaign.id} - ${activeCampaign.name}`
    : null;
  const campaignStatusClass = activeCampaign?.isActive ? "text-bg-success" : "text-bg-secondary";
  const campaignStatusLabel = activeCampaign?.isActive ? "Active" : "Inactive";

  const filteredCampaigns = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return campaigns;
    return campaigns.filter((c) => {
      const code = (c.code ?? `${c.id}`).toLowerCase();
      const name = (c.name ?? "").toLowerCase();
      return code.includes(k) || name.includes(k);
    });
  }, [campaigns, keyword]);

  useEffect(() => {
    if (modalOpen) {
      setSelectedId(activeCampaign ? String(activeCampaign.id) : null);
    }
  }, [modalOpen, activeCampaign]);

  useEffect(() => {
    if (examDataStatus === "idle") {
      dispatch(fetchInitialExamData());
    }
  }, [dispatch, examDataStatus]);

  const handleLogout = () => dispatch(logout());

  const handleConfirm = () => {
    if (!selectedId) return;
    dispatch(campaignSelected(selectedId));
    setModalOpen(false);
    window.location.reload();
  };

  // Reusable Sidebar content
  const SidebarInner = (
    <>
      <div className="p-4">
        <div className="mb-4">
          <p className="mb-1 small text-white-50 text-uppercase fw-semibold"></p>
          <h2 className="h6 mb-0 text-white">ระบบจัดการข้อสอบ</h2>
        </div>
        <nav className="d-flex flex-column gap-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "d-flex align-items-center gap-3 px-3 py-2 rounded-3 fw-medium",
                  isActive ? "bg-orange-100 text-orange-700 shadow-sm" : "text-dark",
                ].join(" ")
              }
              style={({ isActive }) => (isActive ? undefined : { color: "rgba(0,0,0,0.85)" })}
              onClick={() => setMobileSidebarOpen(false)} // auto-close on mobile when navigate
            >
              <Icon size={18} />
              <span className="text-truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 small text-white-50 mt-auto">
        <p className="mb-1 text-white fw-semibold">ฝ่ายสนับสนุน</p>
        <p className="mb-0">โทร 02-123-1234</p>
      </div>

      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage:
            "radial-gradient( circle at 20% 15%, rgba(255,255,255,0.2), transparent 60%)",
          pointerEvents: "none",
        }}
      />
    </>
  );

  return (
    <div className="d-flex min-vh-100">
      {/* Sidebar (desktop ≥ lg) */}
      <aside
        className="d-none d-lg-flex flex-column justify-content-between text-white position-relative overflow-hidden"
        style={{
          width: 260,
          background: "linear-gradient(195deg, #f18a0bff 0%, #ad732cff 55%, #963e00ff 100%)",
        }}
      >
        {SidebarInner}
      </aside>

      {/* Mobile Drawer Sidebar ( < lg ) */}
      <div
        className={`d-lg-none position-fixed top-0 start-0 h-100 ${
          mobileSidebarOpen ? "translate-x-0" : "translate-x--100"
        }`}
        style={{
          width: 280,
          background: "linear-gradient(195deg, #f18a0bff 0%, #ad732cff 55%, #963e00ff 100%)",
          zIndex: 1060,
          transition: "transform 180ms ease",
          transform: mobileSidebarOpen ? "translateX(0)" : "translateX(-100%)",
        }}
        aria-hidden={!mobileSidebarOpen}
      >
        <div className="d-flex align-items-center justify-content-between px-3 py-2">
          <h2 className="h6 text-white mb-0">เมนู</h2>
          <button
            className="btn btn-sm btn-light"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        {SidebarInner}
      </div>

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 1050 }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-grow-1 d-flex flex-column" style={{ backgroundColor: "#fff7ed" }}>
        {/* Compact Header */}
        <header className="bg-white border-bottom px-2 px-md-3 d-flex justify-content-between align-items-center"
                style={{ height: 56 }}>
          <div className="d-flex align-items-center gap-2">
            {/* Hamburger on mobile */}
            <button
              className="btn btn-outline-warning btn-sm d-lg-none"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            <div className="d-flex flex-column">
              <h1 className="h6 mb-0 text-secondary">ระบบจัดการข้อสอบ</h1>

              {/* Collapse long campaign label on xs */}
              <div className="mt-1 small d-none d-sm-block">
                {activeCampaign ? (
                  <>
                    <span className="text-muted me-1">สนามใหญ่:</span>
                    <span className="fw-semibold text-secondary text-truncate" style={{ maxWidth: 260 }}>
                      {campaignLabel}
                    </span>
                    <span className={`badge ${campaignStatusClass} ms-2`}>{campaignStatusLabel}</span>
                  </>
                ) : (
                  <span className="text-muted">No campaign selected</span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Campaign picker: icon-only on xs, text on sm+ */}
            <button
              type="button"
              className="btn btn-warning btn-sm d-flex align-items-center gap-2"
              onClick={() => setModalOpen(true)}
              title="เลือกรอบสอบ (Campaign)"
            >
              <CalendarDays size={16} />
              <span className="d-none d-sm-inline">เลือกรอบสอบ</span>
            </button>

            {/* user summary hidden on very small screens */}
            <div className="text-end d-none d-sm-block">
              <div className="fw-semibold text-secondary text-truncate" style={{ maxWidth: 160 }}>
                {user?.name ?? "Guest User"}
              </div>
              <small className="text-muted">
                {(user?.roles ?? []).join(", ") || "No roles assigned"}
              </small>
            </div>

            {/* Logout: icon-only on xs */}
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
              onClick={handleLogout}
              title="ออกจากระบบ"
            >
              <LogOut size={16} />
              <span className="d-none d-sm-inline">ออกจากระบบ</span>
            </button>
          </div>
        </header>

        <main className="flex-grow-1 overflow-auto">
          <div className="container-fluid py-3 py-md-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modal: เลือกรอบสอบ */}
      {modalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.45)", zIndex: 1050 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-3 shadow position-absolute start-50 top-50 translate-middle"
            style={{ width: "min(720px, 92vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 p-sm-3 border-bottom d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <CalendarDays size={18} />
                <strong>เลือกรอบสอบ (Campaign)</strong>
              </div>
              <button className="btn btn-sm btn-light" onClick={() => setModalOpen(false)}>
                ปิด
              </button>
            </div>

            <div className="p-2 p-sm-3">
              <div className="mb-2 mb-sm-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="ค้นหา: โค้ดหรือชื่อรอบสอบ…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="border rounded-3">
                <div className="list-group list-group-flush" style={{ maxHeight: 360, overflow: "auto" }}>
                  {filteredCampaigns.length === 0 && (
                    <div className="list-group-item text-muted">ไม่พบรายการ</div>
                  )}

                  {filteredCampaigns.map((c) => {
                    const idStr = String(c.id);
                    const isActive = c.isActive ? (
                      <span className="badge text-bg-success ms-2">Active</span>
                    ) : (
                      <span className="badge text-bg-secondary ms-2">Inactive</span>
                    );
                    return (
                      <label key={idStr} className="list-group-item d-flex align-items-center gap-3">
                        <input
                          type="radio"
                          name="campaign"
                          className="form-check-input"
                          checked={selectedId === idStr}
                          onChange={() => setSelectedId(idStr)}
                        />
                        <div className="flex-grow-1">
                          <div className="fw-semibold d-flex align-items-center">
                            <span className="text-truncate">{(c.code ?? idStr) + " - " + (c.name ?? "")}</span>
                            {isActive}
                          </div>
                          {c.note ? <div className="small text-muted">{c.note}</div> : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-2 p-sm-3 border-top d-flex justify-content-end gap-2">
              <button className="btn btn-light" onClick={() => setModalOpen(false)}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                disabled={!selectedId}
                onClick={handleConfirm}
                title="ยืนยันและรีหน้าเพื่อโหลดข้อมูลตามรอบสอบที่เลือก"
              >
                ยืนยันการเลือกรอบสอบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppLayout;

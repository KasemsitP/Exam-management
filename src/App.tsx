// // import { useEffect } from "react";
// // import { BrowserRouter, Routes, Route } from "react-router-dom";
// // import { RequireAuth } from "@/components/auth/RequireAuth";
// // import { useAppDispatch, useAppSelector } from "@/store/hook";
// // import { hydrateAuth, selectAuthStatus } from "@/store/slices/auth.slice";
// // import Login from "@/pages/Login";
// // import SeatAllocationPage from "@/pages/SeatAllocation";
// // // import GraderManagementPage from "@/pages/GraderManagement";
// // //import ScoreReviewPage from "@/pages/ScoreReview";
// // // import AccountsPage from "./pages/AccountManagement";
// // // import BagHandoverPage from "@/pages/BagHandover";
// // //import BagsPage from "@/pages/Bags";
// // //import Dashboard from "@/pages/Dashboard";
// // //import ExamRoomsPage from "@/pages/ExamRooms";
// // //import GradingStationPage from "@/pages/GradingStation";
// // //import ImportCsvPage from "@/pages/importcsv";
// // //import KeyManagementPage from "@/pages/key";
// // //import CampaignsPage from "@/pages/Sessions";
// // //import QrPage from '@/pages/QRScanner'
// // //import SignSheetsPage from "@/pages/SignSheets";
// // import AccountsPage from "./pages/accounts/AccountsPage";
// // import BagHandoverPage from "@/pages/bag-handover/BagHandoverPage";
// // import BagsPage from "@/pages/bags/BagsPage";
// // import Dashboard from "@/pages/dashboard/Dashboard";
// // import ExamRoomsPage from "@/pages/examrooms/ExamRoomsPage";
// // import GradingStationPage from "@/pages/gradingstation/GradingStationPage";
// // import ImportCsvPage from "@/pages/importcsv/ImportCsvPage"
// // import KeyManagementPage from "@/pages/key/KeyManagementPage";
// // import CampaignsPage from "@/pages/campaignsession/CampaignsPage";
// // import QrPage from '@/pages/scan-check/ProctorScanPage';
// // import SignSheetsPage from "@/pages/signsheets/SignSheetsPage";
// // import SubjectPage from "./pages/subjects/SubjectPage";
// // import GraderPage from "@/pages/grader/GradersPage";
// // import AdminResetPage from "@/pages/admin-reset/AdminResetScorePage";
// // //import UserSearchPage from "@/pages/UserSearch";
// // import ScoreReviewPage from "./pages/scores/ScorePage"
// // import SubjectRankingExportPage from "./pages/SubjectRaningExport";
// // // import GradingRecheckPage from "./pages/gradingrecheck/GradingRecheckPage"
// // import { AppLayout } from "@/components/layout/AppLayout";
// // import { BootstrapToastViewport } from "@/components/ui/bootstrap-toast";
// // import HomePage from "./pages/HomePage";
// // import { OverlayLoader } from "@/components/ui/Loading";
// // import SettingsPage from "./pages/settings/SettingsPage";

// // function ProtectedApp() {
// //   return (
// //     <RequireAuth>
// //       <AppLayout />
// //     </RequireAuth>
// //   );
// // }

// // function NotFound() {
// //   return (
// //     <div className="container py-5">
// //       <div className="row justify-content-center">
// //         <div className="col-md-6">
// //           <div className="card shadow-sm text-center p-4">
// //             <h2 className="h5 mb-2">Page not found</h2>
// //             <p className="text-muted mb-0">The page you are looking for does not exist.</p>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // // function FullPageLoader() {
// // //   return (
// // //     <div className="page-loader flex-column bg-dark bg-opacity-25">
// // //       <span className="spinner-border text-primary" role="status"></span>
// // //       <span className="text-gray-800 fs-6 fw-semibold mt-5">Loading...</span>
// // //     </div>
// // //   );
// // // }

// // function AppContent() {
// //   const dispatch = useAppDispatch();
// //   const authStatus = useAppSelector(selectAuthStatus);
// //   useEffect(() => {
// //     if (authStatus === 'idle') {
// //       dispatch(hydrateAuth());
// //     }
// //   }, [dispatch, authStatus]); // เพิ่ม authStatus ใน dependencies
// //   if (authStatus === 'idle' || authStatus === 'loading') {
// //     return <OverlayLoader open={authStatus === 'loading'} label="กำลังโหลด..." />;
// //   }
// //   return (
// //     <BrowserRouter>
// //       <BootstrapToastViewport />
// //       <Routes>
// //         <Route path="/" element={<Login />} />
// //         <Route element={<ProtectedApp />}>
// //            <Route path="/home" element={<HomePage />} />
// //           <Route path="/dashboard" element={<Dashboard />} />
// //           <Route path="/campaign-sessions" element={<CampaignsPage />} />
// //           <Route path="/seat-allocation" element={<SeatAllocationPage />} />
// //           {/* <Route path="/exam-rooms" element={<ExamRoomsPage />} /> */}
// //           <Route path="/bags" element={<BagsPage />} />
// //           <Route path="/bag-handover" element={<BagHandoverPage />} />
// //           <Route path="/import-csv" element={<ImportCsvPage />} />
// //           <Route path="/keys" element={<KeyManagementPage />} />
// //           <Route path="/sign-sheets" element={<SignSheetsPage />} />
// //           {/* <Route path="/grading-recheck" element={<GradingRecheckPage />} /> */}
// //           {/* <Route path="/graders" element={<GraderManagementPage />} /> */}
// //           <Route path="/grading-station" element={<GradingStationPage />} />
// //           <Route path="/score-review" element={<ScoreReviewPage />} />
// //           {/* <Route path="/user-search" element={<UserSearchPage />} /> */}
// //           <Route path="/accounts" element={<AccountsPage />} />
// //           <Route path="/qrscanner" element={<QrPage />} />
// //           <Route path="/subject" element={<SubjectPage />} />
// //           <Route path="/graders" element={<GraderPage />} />
// //           <Route path="/admin-reset" element={< AdminResetPage />} />
// //           <Route path="/subject-ranking-export" element={<SubjectRankingExportPage />} />
// //           <Route path="/settings" element={<SettingsPage />} />
// //           <Route path="*" element={<NotFound />} />
// //         </Route>
// //         <Route path="*" element={<NotFound />} />
// //       </Routes>
// //     </BrowserRouter>
// //   );
// // }

// // export default function App() {
// //   return <AppContent />;
// // }
// import { useEffect, lazy, Suspense , useState } from "react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { RequireAuth } from "@/components/auth/RequireAuth";
// import { useAppDispatch, useAppSelector } from "@/store/hook";
// import { hydrateAuth, selectAuthStatus } from "@/store/slices/auth.slice";
// import { AppLayout } from "@/components/layout/AppLayout";
// import { BootstrapToastViewport } from "@/components/ui/bootstrap-toast";
// import { OverlayLoader } from "@/components/ui/Loading";

// // ==========================================
// // 1. นำเข้าหน้า Page ต่างๆ แบบ Lazy Load
// // ==========================================
// const Login = lazy(() => import("@/pages/Login"));
// const HomePage = lazy(() => import("./pages/HomePage"));
// const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
// const CampaignsPage = lazy(() => import("@/pages/campaignsession/CampaignsPage"));
// const SeatAllocationPage = lazy(() => import("@/pages/SeatAllocation"));
// const BagsPage = lazy(() => import("@/pages/bags/BagsPage"));
// const BagHandoverPage = lazy(() => import("@/pages/bag-handover/BagHandoverPage"));
// const ImportCsvPage = lazy(() => import("@/pages/importcsv/ImportCsvPage"));
// const KeyManagementPage = lazy(() => import("@/pages/key/KeyManagementPage"));
// const SignSheetsPage = lazy(() => import("@/pages/signsheets/SignSheetsPage"));
// const GradingStationPage = lazy(() => import("@/pages/gradingstation/GradingStationPage"));
// const ScoreReviewPage = lazy(() => import("./pages/scores/ScorePage"));
// const AccountsPage = lazy(() => import("./pages/accounts/AccountsPage"));
// const QrPage = lazy(() => import('@/pages/scan-check/ProctorScanPage'));
// const SubjectPage = lazy(() => import("./pages/subjects/SubjectPage"));
// const GraderPage = lazy(() => import("@/pages/grader/GradersPage"));
// const AdminResetPage = lazy(() => import("@/pages/admin-reset/AdminResetScorePage"));
// const SubjectRankingExportPage = lazy(() => import("./pages/SubjectRaningExport"));
// const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));

// // ==========================================
// // 2. คอมโพเนนต์ที่ใช้ร่วมกัน (ไม่ต้อง Lazy Load)
// // ==========================================
// function ProtectedApp() {
//   return (
//     <RequireAuth>
//       <AppLayout />
//     </RequireAuth>
//   );
// }

// function NotFound() {
//   return (
//     <div className="container py-5">
//       <div className="row justify-content-center">
//         <div className="col-md-6">
//           <div className="card shadow-sm text-center p-4">
//             <h2 className="h5 mb-2">Page not found</h2>
//             <p className="text-muted mb-0">The page you are looking for does not exist.</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ==========================================
// // 3. App Content
// // ==========================================
// function AppContent() {
//   const dispatch = useAppDispatch();
//   const authStatus = useAppSelector(selectAuthStatus);

//   // 1. เพิ่ม state เพื่อบอกว่าระบบโหลดครั้งแรก (Initial Load) เสร็จหรือยัง
//   const [isInitialLoading, setIsInitialLoading] = useState(true);

//   useEffect(() => {
//     const checkAuth = async () => {
//       if (authStatus === 'idle') {
//         await dispatch(hydrateAuth());
//       }
//       setIsInitialLoading(false); // โหลดเสร็จแล้ว ปิด Loader
//     };

//     checkAuth();
//   }, [dispatch, authStatus]);

//   // 2. เปลี่ยนเงื่อนไข: โชว์ Loader เฉพาะตอนโหลดครั้งแรกสุดเท่านั้น
//   if (isInitialLoading) {
//     return <OverlayLoader open={true} label="กำลังโหลด..." />;
//   }

//   return (
//     <BrowserRouter>
//       <BootstrapToastViewport />
//       {/* ใช้ Suspense ครอบ Routes ทั้งหมด 
//         เวลาที่ผู้ใช้กดเปลี่ยนหน้า มันจะแสดง OverlayLoader ระหว่างที่กำลังดาวน์โหลดไฟล์ JS ของหน้านั้นๆ 
//       */}
//       <Suspense fallback={<OverlayLoader open={true} label="กำลังโหลดหน้าเว็บ..." />}>
//         <Routes>
//           <Route path="/" element={<Login />} />

//           <Route element={<ProtectedApp />}>
//             <Route path="/home" element={<HomePage />} />
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/campaign-sessions" element={<CampaignsPage />} />
//             <Route path="/seat-allocation" element={<SeatAllocationPage />} />
//             <Route path="/bags" element={<BagsPage />} />
//             <Route path="/bag-handover" element={<BagHandoverPage />} />
//             <Route path="/import-csv" element={<ImportCsvPage />} />
//             <Route path="/keys" element={<KeyManagementPage />} />
//             <Route path="/sign-sheets" element={<SignSheetsPage />} />
//             <Route path="/grading-station" element={<GradingStationPage />} />
//             <Route path="/score-review" element={<ScoreReviewPage />} />
//             <Route path="/accounts" element={<AccountsPage />} />
//             <Route path="/qrscanner" element={<QrPage />} />
//             <Route path="/subject" element={<SubjectPage />} />
//             <Route path="/graders" element={<GraderPage />} />
//             <Route path="/admin-reset" element={<AdminResetPage />} />
//             <Route path="/subject-ranking-export" element={<SubjectRankingExportPage />} />
//             <Route path="/settings" element={<SettingsPage />} />
//             <Route path="*" element={<NotFound />} />
//           </Route>

//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </Suspense>
//     </BrowserRouter>
//   );
// }

// // ==========================================
// // 4. Main App Export
// // ==========================================
// export default function App() {
//   return <AppContent />;
// }

import { useEffect, useState, lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { hydrateAuth, selectAuthStatus } from "@/store/slices/auth.slice";
import { AppLayout } from "@/components/layout/AppLayout";
import { BootstrapToastViewport } from "@/components/ui/bootstrap-toast";
import { OverlayLoader } from "@/components/ui/Loading";

import {
  Login,
  HomePage,
  Dashboard,
  CampaignsPage,
  SeatAllocationPage,
  BagsPage,
  BagHandoverPage,
  ImportCsvPage,
  KeyManagementPage,
  SignSheetsPage,
  GradingStationPage,
  ScoreReviewPage,
  AccountsPage,
  QrPage,
  SubjectPage,
  GraderPage,
  AdminResetPage,
  SubjectRankingExportPage,
  SettingsPage,
} from "@/routes/pages";

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <h2 className="h5 mb-2">ไม่พบหน้า</h2>
      <p className="text-muted">หน้าที่คุณกำลังค้นหาไม่มีอยู่จริง</p>
    </div>
  );
}

// ==========================================
// 3. กำหนด Routing แบบใหม่ (createBrowserRouter)
// ==========================================
// หมายเหตุ: ใน AppLayout ของคุณต้องมีการใส่ <Outlet /> ไว้ตรงส่วนเนื้อหา Content เพื่อให้หน้าต่างๆ ไปแทรกได้
const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
children: [
      { path: "/home", element: <HomePage />, loader: HomePage.preload },
      { path: "/dashboard", element: <Dashboard />, loader: Dashboard.preload },
      { path: "/campaign-sessions", element: <CampaignsPage />, loader: CampaignsPage.preload },
      { path: "/seat-allocation", element: <SeatAllocationPage />, loader: SeatAllocationPage.preload },
      { path: "/bags", element: <BagsPage />, loader: BagsPage.preload },
      { path: "/import-csv", element: <ImportCsvPage />, loader: ImportCsvPage.preload },
      { path: "/keys", element: <KeyManagementPage />, loader: KeyManagementPage.preload },
      { path: "/sign-sheets", element: <SignSheetsPage />, loader: SignSheetsPage.preload },
      { path: "/grading-station", element: <GradingStationPage />, loader: GradingStationPage.preload },
      { path: "/score-review", element: <ScoreReviewPage />, loader: ScoreReviewPage.preload },
      { path: "/accounts", element: <AccountsPage />, loader: AccountsPage.preload },
      { path: "/qrscanner", element: <QrPage />, loader: QrPage.preload },
      { path: "/subject", element: <SubjectPage />, loader: SubjectPage.preload },
      { path: "/graders", element: <GraderPage />, loader: GraderPage.preload },
      { path: "/admin-reset", element: <AdminResetPage />, loader: AdminResetPage.preload },
      { path: "/subject-ranking-export", element: <SubjectRankingExportPage />, loader: SubjectRankingExportPage.preload },
      { path: "/settings", element: <SettingsPage />, loader: SettingsPage.preload },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

// ==========================================
// 4. App Content
// ==========================================
function AppContent() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authStatus === "idle") {
        await dispatch(hydrateAuth());
      }
      setIsInitialLoading(false);
    };
    checkAuth();
  }, [dispatch, authStatus]);

  if (isInitialLoading) {
    return <OverlayLoader open={true} label="" />;
  }

return (
  <>
    <BootstrapToastViewport />
    <RouterProvider
      router={router}
    />
  </>
);
}

export default function App() {
  return <AppContent />;
}
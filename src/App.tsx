import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { hydrateAuth, selectAuthStatus } from "@/store/slices/auth.slice";
import Login from "@/pages/Login";
import SeatAllocationPage from "@/pages/SeatAllocation";
// import GraderManagementPage from "@/pages/GraderManagement";
import ScoreReviewPage from "@/pages/ScoreReview";
// import AccountsPage from "./pages/AccountManagement";
// import BagHandoverPage from "@/pages/BagHandover";
//import BagsPage from "@/pages/Bags";
//import Dashboard from "@/pages/Dashboard";
//import ExamRoomsPage from "@/pages/ExamRooms";
//import GradingStationPage from "@/pages/GradingStation";
//import ImportCsvPage from "@/pages/importcsv";
//import KeyManagementPage from "@/pages/key";
//import CampaignsPage from "@/pages/Sessions";
//import QrPage from '@/pages/QRScanner'
//import SignSheetsPage from "@/pages/SignSheets";
import AccountsPage from "./pages/accounts/AccountsPage";
import BagHandoverPage from "@/pages/bag-handover/BagHandoverPage";
import BagsPage from "@/pages/bags/BagsPage";
import Dashboard from "@/pages/dashboard/Dashboard";
import ExamRoomsPage from "@/pages/examrooms/ExamRoomsPage";
import GradingStationPage from "@/pages/gradingstation/GradingStationPage";
import ImportCsvPage from "@/pages/importcsv/ImportCsvPage"
import KeyManagementPage from "@/pages/key/KeyManagementPage";
import CampaignsPage from "@/pages/campaignsession/CampaignsPage";
import QrPage from '@/pages/scan-check/ProctorScanPage';
import SignSheetsPage from "@/pages/signsheets/SignSheetsPage";
import SubjectPage from "./pages/subjects/SubjectPage";
import GraderPage from "@/pages/grader/GradersPage";
//import UserSearchPage from "@/pages/UserSearch";
import { AppLayout } from "@/components/layout/AppLayout";
import { BootstrapToastViewport } from "@/components/ui/bootstrap-toast";
import{OverlayLoader} from "@/components/ui/Loading";

function ProtectedApp() {
  return (
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  );
}

function NotFound() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm text-center p-4">
            <h2 className="h5 mb-2">Page not found</h2>
            <p className="text-muted mb-0">The page you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// function FullPageLoader() {
//   return (
//     <div className="page-loader flex-column bg-dark bg-opacity-25">
//       <span className="spinner-border text-primary" role="status"></span>
//       <span className="text-gray-800 fs-6 fw-semibold mt-5">Loading...</span>
//     </div>
//   );
// }

function AppContent() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  useEffect(() => {
    if (authStatus === 'idle') {
      dispatch(hydrateAuth());
    }
  }, [dispatch, authStatus]); // เพิ่ม authStatus ใน dependencies
  if (authStatus === 'idle' || authStatus === 'loading') {
    return <OverlayLoader open={authStatus === 'loading'} label="กำลังโหลด..." />;
  }
  return (
    <BrowserRouter>
      <BootstrapToastViewport />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedApp />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaign-sessions" element={<CampaignsPage />} />
          <Route path="/seat-allocation" element={<SeatAllocationPage />} />
          <Route path="/exam-rooms" element={<ExamRoomsPage />} />
          <Route path="/bags" element={<BagsPage />} />
          <Route path="/bag-handover" element={<BagHandoverPage />} />
          <Route path="/import-csv" element={<ImportCsvPage />} />
          <Route path="/keys" element={<KeyManagementPage />} />
          <Route path="/sign-sheets" element={<SignSheetsPage />} />
          {/* <Route path="/graders" element={<GraderManagementPage />} /> */}
          <Route path="/grading-station" element={<GradingStationPage />} />
          <Route path="/score-review" element={<ScoreReviewPage />} />
          {/* <Route path="/user-search" element={<UserSearchPage />} /> */}
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/qrscanner" element={<QrPage />} />
          <Route path="/subject" element={<SubjectPage/>}/>
           <Route path="/graders" element={<GraderPage/>}/>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppContent />;
}

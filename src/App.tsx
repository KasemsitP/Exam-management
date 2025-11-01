import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAppDispatch, useAppSelector } from "@/store/hook"; 
import { hydrateAuth , selectAuthStatus } from "@/store/slices/auth.slice";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CampaignsPage from "@/pages/Sessions";
import SeatAllocationPage from "@/pages/SeatAllocation";
import ExamRoomsPage from "@/pages/ExamRooms";
import BagsPage from "@/pages/Bags";
import BagHandoverPage from "@/pages/BagHandover";
import ImportCsvPage from "@/pages/importcsv";
import SignSheetsPage from "@/pages/SignSheets";
import GraderManagementPage from "@/pages/GraderManagement";
import GradingStationPage from "@/pages/GradingStation";
import ScoreReviewPage from "@/pages/ScoreReview";
import KeyManagementPage from "@/pages/key";
import UserSearchPage from "@/pages/UserSearch";
import { AppLayout } from "@/components/layout/AppLayout";

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

function FullPageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Loading Application...</h2>
    </div>
  );
}

function AppContent() {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus); 
  useEffect(() => {
    if (authStatus === 'idle') {
      dispatch(hydrateAuth());
    }
  }, [dispatch, authStatus]); // เพิ่ม authStatus ใน dependencies
  if (authStatus === 'idle' || authStatus === 'loading') {
    return <FullPageLoader />;
  }
  return (
    <BrowserRouter>
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
          <Route path="/graders" element={<GraderManagementPage />} />
          <Route path="/grading-station" element={<GradingStationPage />} />
          <Route path="/score-review" element={<ScoreReviewPage />} />
          <Route path="/user-search" element={<UserSearchPage />} />
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

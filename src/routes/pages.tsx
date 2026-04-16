// src/routes/pages.ts
import { lazyWithPreload } from "@/lib/lazypreload";

export const Login = lazyWithPreload(() => import("@/pages/Login"));
export const HomePage = lazyWithPreload(() => import("@/pages/HomePage"));
export const Dashboard = lazyWithPreload(() => import("@/pages/dashboard/Dashboard"));
export const CampaignsPage = lazyWithPreload(() => import("@/pages/campaignsession/CampaignsPage"));
export const SeatAllocationPage = lazyWithPreload(() => import("@/pages/SeatAllocation"));
export const BagsPage = lazyWithPreload(() => import("@/pages/bags/BagsPage"));
export const BagHandoverPage = lazyWithPreload(() => import("@/pages/bag-handover/BagHandoverPage"));
export const ImportCsvPage = lazyWithPreload(() => import("@/pages/importcsv/ImportCsvPage"));
export const KeyManagementPage = lazyWithPreload(() => import("@/pages/key/KeyManagementPage"));
export const SignSheetsPage = lazyWithPreload(() => import("@/pages/signsheets/SignSheetsPage"));
export const GradingStationPage = lazyWithPreload(() => import("@/pages/gradingstation/GradingStationPage"));
export const ScoreReviewPage = lazyWithPreload(() => import("@/pages/scores/ScorePage"));
export const AccountsPage = lazyWithPreload(() => import("@/pages/accounts/AccountsPage"));
export const QrPage = lazyWithPreload(() => import("@/pages/scan-check/ProctorScanPage"));
export const SubjectPage = lazyWithPreload(() => import("@/pages/subjects/SubjectPage"));
export const GraderPage = lazyWithPreload(() => import("@/pages/grader/GradersPage"));
export const AdminResetPage = lazyWithPreload(() => import("@/pages/admin-reset/AdminResetScorePage"));
export const SubjectRankingExportPage = lazyWithPreload(() => import("@/pages/SubjectRaningExport"));
export const SettingsPage = lazyWithPreload(() => import("@/pages/settings/SettingsPage"));
export const GraderScoreSummaryPage = lazyWithPreload(() => import("@/pages/grader-score-summary/GraderScoreSummaryPage"));
export const ActiveBagsPage = lazyWithPreload(() => import("@/pages/active-bags/ActiveBagsPage"));

export const PRELOAD_BY_PATH: Record<string, (() => Promise<any>) | undefined> = {
  "/home": HomePage.preload,
  "/dashboard": Dashboard.preload,
  "/campaign-sessions": CampaignsPage.preload,
  "/seat-allocation": SeatAllocationPage.preload,
  "/bags": BagsPage.preload,
  "/bag-handover": BagHandoverPage.preload,
  "/import-csv": ImportCsvPage.preload,
  "/keys": KeyManagementPage.preload,
  "/sign-sheets": SignSheetsPage.preload,
  "/grading-station": GradingStationPage.preload,
  "/score-review": ScoreReviewPage.preload,
  "/accounts": AccountsPage.preload,
  "/qrscanner": QrPage.preload,
  "/subject": SubjectPage.preload,
  "/graders": GraderPage.preload,
  "/admin-reset": AdminResetPage.preload,
  "/subject-ranking-export": SubjectRankingExportPage.preload,
  "/settings": SettingsPage.preload,
  "/grader-score-summary": GraderScoreSummaryPage.preload,
  "/active-bags": ActiveBagsPage.preload,
};
// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import type { PieLabelRenderProps } from "recharts";
import axios from "axios";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, GraduationCap, Package, Users, BookOpen } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import {
  selectDefaultBagCapacity,
  selectBagsForCampaign,
  fetchBagsForCampaignThunk,
} from "@/store/slices/bags.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { ShowIfCan } from "@/components/auth/ShowIfCan";
import { OverlayLoader } from "@/components/ui/Loading";

/* -----------------------------------------
   ✅ Muted / Neutral theme (ไม่ฉูดฉาด)
------------------------------------------ */
const primary = "#334155"; // slate-700
const muted = "#64748B"; // slate-500
const grid = "#E2E8F0"; // slate-200
const surface = "#FFFFFF";
const border = "#E2E8F0"; // slate-200
const pieColors = [
  "#3B82F6", // Blue
  "#22C55E", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Violet
];

/* ---------- Mock (optional) ---------- */
interface ScoreBucket {
  label: string;
  count: number;
}
interface ScoreDistributionAPI {
  totalUsers: number;
  noScore: number;
  buckets: ScoreBucket[];
}
const MOCK_SCORE_DISTRIBUTION: ScoreDistributionAPI = {
  totalUsers: 1105,
  noScore: 0,
  buckets: [
    { label: "1-5", count: 12 },
    { label: "6-10", count: 8 },
    { label: "11-15", count: 22 },
    { label: "16-20", count: 18 },
    { label: "21-25", count: 45 },
    { label: "26-30", count: 38 },
    { label: "31-35", count: 72 },
    { label: "36-40", count: 60 },
    { label: "41-45", count: 98 },
    { label: "46-50", count: 110 },
    { label: "51-55", count: 95 },
    { label: "56-60", count: 130 },
    { label: "61-65", count: 102 },
    { label: "66-70", count: 115 },
    { label: "71-75", count: 88 },
    { label: "76-80", count: 93 },
    { label: "81-85", count: 65 },
    { label: "86-90", count: 58 },
    { label: "91-95", count: 52 },
    { label: "96-100", count: 34 },
    { label: "101-105", count: 40 },
    { label: "106-110", count: 18 },
    { label: "111-115", count: 26 },
    { label: "116-120", count: 9 },
    { label: "121-125", count: 14 },
    { label: "126-130", count: 4 },
    { label: "131-135", count: 7 },
    { label: "136-140", count: 2 },
    { label: "141-145", count: 5 },
    { label: "146-150", count: 1 },
    { label: "151-155", count: 1 },
    { label: "156-160", count: 1 },
    { label: "161-165", count: 1 },
    { label: "166-170", count: 1 },
  ],
};

/* ---------- Types (Sessions/Subjects/etc.) ---------- */

interface SessionAPI {
  sessionId: number;
  sessionCode: string;
  subject_name: string;
  bags: { total: number; capacity: number };
  users: { inCampaign: number; inSession: number };
  importStatus: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
  encryption: {
    status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
    encrypted: number;
    pending: number;
  };
}

interface SubjectQuestionApi {
  id: number;
  questionNo: number;
  label: string;
  maxScore: string;
}
interface SubjectQuestionsApi {
  subjectId: number;
  code: string;
  name: string;
  questions: SubjectQuestionApi[];
}

interface RawStatusItem {
  session_id: number;
  subject_id: number;
  booklet_count: number;
  question_count: number;
  expected_slots: number;
  actual_slots: number;
  assigned_slots: string;
  completed_slots: string;
  disputed_slots: string;
  pending_slots: string;
  missing_slots: number;
  question_count_sq: number;
  question_count_ss: number;
  mismatch_question_count: number;
}

interface RawBookletsBySessionItem {
  session_id: number;
  session_code: string;
  count: number;
  subject_name: string;
}

interface SeatAssignmentStatus {
  room_code: string;
  count_user: number;
  capacity: number;
}

interface RawAverageQuestionScoreItem {
  question_no: number;
  label: string;
  final_avg: number;
}
type RawAverageQuestionScore = Record<string, RawAverageQuestionScoreItem[]>;

/* ---------- NEW API: แยก summary/charts ---------- */

interface SummaryAPI {
  campaignId: number;
  sessionCount: number;
  subjectCount: number;
  graders: { total: number; withLogin: number };
  keys: { total: number; active: number };
}

type DashboardSummaryResponse = {
  summary: SummaryAPI;
  sessions: Record<string, SessionAPI>;
  subjectQuestions?: Record<string, SubjectQuestionsApi>;
  rawStatus?: RawStatusItem[];
  rawBookletsCount?: number;
  rawBookletsBySession?: RawBookletsBySessionItem[];
  seatAssignmentStatus?: SeatAssignmentStatus[];
};

type DashboardChartsResponse = {
  scoreDistribution?: ScoreDistributionAPI;
  rawAverageQuestionScore?: RawAverageQuestionScore;
  rawDisputedQuestions?: number;
  avgScorePerQuestion?: any[];
};

type SlotCoverageResponse = {
  rawStatus: RawStatusItem[];
  rawDisputedQuestions?: number;
};
/* ---------- Types ฝั่ง UI ---------- */

interface BagCount {
  sessionId: number;
  sessionLabel: string;
  bagCount: number;
  [key: string]: any;
}

interface ImportStatusUI {
  sessionId: number;
  sessionCode: string;
  subject_name: string;
  inCampaign: number;
  inSession: number;
  importStatus: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
}

interface EncryptedStatusUI {
  sessionId: number;
  sessionCode: string;
  subject_name: string;
  status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
  encrypted: number;
  pending: number;
  totalUsersInSession: number;
}

type Tone = "neutral" | "good" | "warn";

const badgeStyle = (tone: Tone): React.CSSProperties => {
  if (tone === "good")
    return {
      background: "#D1FAE5",
      color: "#065F46",
      border: "1px solid #10B981",
    };
  if (tone === "warn")
    return {
      background: "#FEF3C7",
      color: "#92400E",
      border: "1px solid #F59E0B",
    };
  return {
    background: "#F8FAFC",
    color: "#475569",
    border: "1px solid #E2E8F0",
  };
};

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const defaultBagCapacity = useAppSelector(selectDefaultBagCapacity);
  const user = useAppSelector(selectCurrentUser);

  const bags = useAppSelector(selectBagsForCampaign(activeCampaign?.id));

  /* ---------- Local state (NEW) ---------- */
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryResponse | null>(null);
  const [dashboardCharts, setDashboardCharts] = useState<DashboardChartsResponse | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [scoreChartData, setScoreChartData] = useState<{ range: string; count: number }[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedAvgSessionId, setSelectedAvgSessionId] = useState<string | null>(null);
  const [slotCoverage, setSlotCoverage] = useState<SlotCoverageResponse | null>(null);
const [loadingSlot, setLoadingSlot] = useState(false);

  const USE_MOCK_SCORE = false;

  // 1) ช่วงคะแนน 1–170 (step 5)
  const ALL_SCORE_BUCKETS: string[] = [];
  for (let start = 1; start <= 170; start += 5) {
    ALL_SCORE_BUCKETS.push(`${start}-${start + 4}`);
  }

  const buildScoreChartData = (scoreDistribution: ScoreDistributionAPI) => {
    if (!scoreDistribution) return [];
    const { buckets, noScore } = scoreDistribution;

    const bucketMap = new Map<string, number>();
    for (const b of buckets ?? []) bucketMap.set(b.label, Number(b.count ?? 0));

    const bucketData = ALL_SCORE_BUCKETS.map((label) => ({
      range: label,
      count: bucketMap.get(label) ?? 0,
    }));

    bucketData.push({ range: "ยังไม่มีคะแนน", count: Number(noScore ?? 0) });
    return bucketData;
  };

  // -------- fetch (NEW 2 endpoints) --------
  useEffect(() => {
    if (!activeCampaign?.id) {
      setIsInitialLoading(false);
      return;
    }

    let interval: NodeJS.Timeout;
    let isFetchingSummary = false;
    let isFetchingCharts = false;
    let isFirstLoad = true;

    const fetchSummary = async () => {
      if (isFetchingSummary) return;
      isFetchingSummary = true;

      try {
        setLoadingSummary(true);
        setDashboardError(null);

        const [summaryRes] = await Promise.all([
          axios.get(`/api/dashboard/campaign/${activeCampaign.id}`),
          dispatch(fetchBagsForCampaignThunk(activeCampaign.id)).unwrap(),
        ]);

        setDashboardSummary(summaryRes.data);
      } catch (err) {
        setDashboardError("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
        setDashboardSummary(null);
      } finally {
        isFetchingSummary = false;
        setLoadingSummary(false);

        if (isFirstLoad) {
          setIsInitialLoading(false);
          isFirstLoad = false;
        }
      }
    };
    const fetchSlotCoverage = async () => {
  try {
    setLoadingSlot(true);
    const res = await axios.get(`/api/dashboard/campaign/${activeCampaign.id}/slot-coverage`);
    setSlotCoverage(res.data);
  } catch (e) {
    console.warn("โหลด slot-coverage ไม่สำเร็จ", e);
    setSlotCoverage(null);
  } finally {
    setLoadingSlot(false);
  }
};

    const fetchCharts = async () => {
      if (isFetchingCharts) return;
      isFetchingCharts = true;

      try {
        setLoadingCharts(true);
        const chartsRes = await axios.get(`/api/dashboard/campaign/${activeCampaign.id}/charts`);
        setDashboardCharts(chartsRes.data);
      } catch (err) {
        // charts พังไม่ล้มทั้งหน้า
        console.warn("โหลด dashboard charts ไม่สำเร็จ", err);
        setDashboardCharts(null);
      } finally {
        isFetchingCharts = false;
        setLoadingCharts(false);
      }
    };

    // โหลด summary ก่อน แล้วค่อย charts
    fetchSummary().then(() => {
        fetchSlotCoverage();
        fetchCharts();
    });

    // refresh summary ทุก 1 นาที
interval = setInterval(() => {
  fetchSummary();
  fetchSlotCoverage();
  console.log("อัพเดตแดชบอร์ดอัตโนมัติ (summary + slot)");
}, 60000);

    return () => clearInterval(interval);
  }, [activeCampaign?.id, dispatch]);

  // build score chart
  useEffect(() => {
    if (USE_MOCK_SCORE) {
      setScoreChartData(buildScoreChartData(MOCK_SCORE_DISTRIBUTION));
      return;
    }
    if (!dashboardCharts?.scoreDistribution) return;
    setScoreChartData(buildScoreChartData(dashboardCharts.scoreDistribution));
  }, [dashboardCharts, USE_MOCK_SCORE]);

  /* ---------- Derived Data ---------- */

  const calculateUsers =
    dashboardSummary?.seatAssignmentStatus?.reduce((sum, s) => sum + s.count_user, 0) ?? 0;

  const importStatusList: ImportStatusUI[] = useMemo(() => {
    if (!dashboardSummary?.sessions) return [];
    return Object.values(dashboardSummary.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      inCampaign: s.users.inCampaign,
      inSession: s.users.inSession,
      importStatus: s.importStatus,
      subject_name: s.subject_name,
    }));
  }, [dashboardSummary]);

  const encryptedStatusList: EncryptedStatusUI[] = useMemo(() => {
    if (!dashboardSummary?.sessions) return [];
    return Object.values(dashboardSummary.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      status: s.encryption.status,
      encrypted: s.encryption.encrypted,
      pending: s.encryption.pending,
      totalUsersInSession: s.users.inSession,
      subject_name: s.subject_name,
    }));
  }, [dashboardSummary]);

  const sessionCount = useMemo(() => {
    if (!dashboardSummary) return 0;
    if (dashboardSummary.summary?.sessionCount != null) return dashboardSummary.summary.sessionCount;
    return Object.keys(dashboardSummary.sessions ?? {}).length;
  }, [dashboardSummary]);

  const subjectCount = dashboardSummary?.summary?.subjectCount ?? 0;

  const totalUsersInCampaign = useMemo(() => {
    if (!dashboardSummary?.sessions) return 0;
    const sessionsArr = Object.values(dashboardSummary.sessions);
    return sessionsArr.reduce((max, s) => Math.max(max, s.users.inCampaign), 0);
  }, [dashboardSummary]);

  const totalBags = useMemo(() => {
    if (!dashboardSummary?.sessions) return 0;
    return Object.values(dashboardSummary.sessions).reduce((sum, s) => sum + (s.bags?.total ?? 0), 0);
  }, [dashboardSummary]);

  const gradersCount = dashboardSummary?.summary?.graders?.total ?? 0;
  const keysCount = dashboardSummary?.summary?.keys?.total ?? 0;

  const bagCounts: BagCount[] = useMemo(() => {
    if (!dashboardSummary?.sessions) return [];
    return Object.values(dashboardSummary.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionLabel: s.sessionCode,
      sessionFullLabel: `${s.sessionCode} (${s.subject_name ?? "-"})`,
      bagCount: s.bags.total,
    }));
  }, [dashboardSummary]);

  const subjectQuestionList = useMemo(() => {
    if (!dashboardSummary?.subjectQuestions) return [];

    const sessionsBySubjectName: Record<string, string[]> = {};
    if (dashboardSummary.sessions) {
      Object.values(dashboardSummary.sessions).forEach((s) => {
        if (!s.subject_name) return;

        const names = String(s.subject_name)
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);

        names.forEach((name) => {
          if (!sessionsBySubjectName[name]) sessionsBySubjectName[name] = [];
          sessionsBySubjectName[name].push(s.sessionCode);
        });
      });
    }

    return Object.values(dashboardSummary.subjectQuestions).map((subj) => ({
      subjectId: subj.subjectId,
      code: subj.code,
      name: subj.name,
      questions: subj.questions,
      questionCount: subj.questions.length,
      totalMaxScore: subj.questions.reduce((sum, q) => sum + Number(q.maxScore ?? 0), 0),
      sessionCodes: sessionsBySubjectName[subj.name] ?? [],
    }));
  }, [dashboardSummary?.subjectQuestions, dashboardSummary?.sessions]);

  const sessionsBySubjectName = useMemo(() => {
    if (!dashboardSummary?.sessions) return {} as Record<string, string[]>;
    const map: Record<string, string[]> = {};
    Object.values(dashboardSummary.sessions).forEach((sess) => {
      if (!sess.subject_name) return;
      if (!map[sess.subject_name]) map[sess.subject_name] = [];
      map[sess.subject_name].push(sess.sessionCode);
    });
    return map;
  }, [dashboardSummary?.sessions]);

  const subjectList = useMemo(() => {
    if (!dashboardSummary?.subjectQuestions) return [];
    return Object.values(dashboardSummary.subjectQuestions).map((subj) => {
      const sessionCodes = sessionsBySubjectName[subj.name] ?? [];
      return {
        subjectId: subj.subjectId,
        code: subj.code,
        name: subj.name,
        questionCount: subj.questions.length,
        totalMaxScore: subj.questions.reduce((sum, q) => sum + Number(q.maxScore ?? 0), 0),
        sessions: sessionCodes,
      };
    });
  }, [dashboardSummary?.subjectQuestions, sessionsBySubjectName]);

  // Avg score dropdown options (from charts + sessions from summary)
  const avgScoreSessionOptions = useMemo(() => {
    if (!dashboardCharts?.rawAverageQuestionScore || !dashboardSummary?.sessions) return [];
    return Object.keys(dashboardCharts.rawAverageQuestionScore).map((sessionId) => {
      const session = Object.values(dashboardSummary.sessions).find((s) => String(s.sessionId) === sessionId);
      return {
        sessionId,
        label: session ? `${session.sessionCode} - ${session.subject_name}` : `Session ${sessionId}`,
      };
    });
  }, [dashboardCharts?.rawAverageQuestionScore, dashboardSummary?.sessions]);

  useEffect(() => {
    if (avgScoreSessionOptions.length > 0 && !selectedAvgSessionId) {
      setSelectedAvgSessionId(avgScoreSessionOptions[0].sessionId);
    }
  }, [avgScoreSessionOptions, selectedAvgSessionId]);

  const avgQuestionChartData = useMemo(() => {
    if (!dashboardCharts?.rawAverageQuestionScore || !selectedAvgSessionId) return [];
    const items = dashboardCharts.rawAverageQuestionScore[selectedAvgSessionId] ?? [];
    return items.map((item) => ({
      questionNo: item.question_no,
      label: `ข้อ ${item.question_no}`,
      fullLabel: item.label,
      avgScore: Number(item.final_avg?.toFixed(2) ?? 0),
    }));
  }, [dashboardCharts?.rawAverageQuestionScore, selectedAvgSessionId]);

  const renderLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;

    if (
      typeof cx !== "number" ||
      typeof cy !== "number" ||
      typeof midAngle !== "number" ||
      typeof innerRadius !== "number" ||
      typeof outerRadius !== "number" ||
      typeof value !== "number"
    ) {
      return null;
    }

    const total = bagCounts.reduce((sum, b) => sum + b.bagCount, 0);
    const percent = total > 0 ? ((value / total) * 100).toFixed(0) : "0";

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill="#334155"
        pointerEvents="none"
      >
        {value} ({percent}%)
      </text>
    );
  };

  /* ---------- Render ---------- */

  if (isInitialLoading) {
    return <OverlayLoader open={true} label="" />;
  }

  return (
    <ShowIfCan
      permission="dashboard"
      fallback={<div className="p-4 alert alert-warning">คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดนี้</div>}
    >
      <div className="container-fluid px-3 px-sm-4 py-3 gap-4 d-flex flex-column">
        {/* overlay เฉพาะตอน summary โหลด (ไม่ทับทุกครั้งที่ charts โหลด) */}
        {loadingSummary && <OverlayLoader open={true} label="" />}

        {/* Header */}
        <div style={{ flex: "1 1 100%", minWidth: 160 }}>
          <div
            className="card shadow-sm h-100"
            style={{
              borderTop: "4px solid #494c52",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 12px rgba(73,76,82,0.12)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="fw-semibold text-uppercase small text-muted">แดชบอร์ดสรุปภาพรวม</div>
              </div>

              <h2 className="h4 fw-bold mb-0 text-dark">
                {activeCampaign ? activeCampaign.name : "ยังไม่ได้เลือกแคมเปญ"}
              </h2>
            </div>
          </div>
        </div>

        <>
          {dashboardError && <div className="alert alert-danger shadow-sm border-0">{dashboardError}</div>}

          {/* Stat Cards */}
          <section className="d-flex flex-wrap gap-3 gap-md-4">
            {/* Sessions */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div
                className="card shadow-sm h-100"
                style={{
                  borderLeft: "4px solid #3B82F6",
                  borderTop: "3px solid #3B82F6",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนรายวิชาที่สอบทั้งหมด
                    </div>
                    <CalendarDays size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {sessionCount}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    วิชา
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div
                className="card shadow-sm h-100"
                style={{
                  borderLeft: "4px solid #22C55E",
                  borderTop: "3px solid #22C55E",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(34,197,94,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      รายวิชาที่สอบทั้งหมด
                    </div>
                    <GraduationCap size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>

                  {subjectList.length > 0 && (
                    <ul className="list-unstyled mb-0 text-dark small" style={{ fontSize: "0.85rem" }}>
                      {subjectList.map((subj) => (
                        <li key={subj.subjectId} className="fw-bold text-truncate">
                          {subj.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Total Users */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div
                className="card shadow-sm h-100"
                style={{
                  borderLeft: "4px solid #F59E0B",
                  borderTop: "3px solid #F59E0B",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,158,11,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      ผู้เข้าสอบภายในรอบสอบนี้
                    </div>
                    <Users size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {totalUsersInCampaign.toLocaleString()}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    คน
                  </div>
                </div>
              </div>
            </div>

            {/* Total Bags */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div
                className="card shadow-sm h-100"
                style={{
                  borderLeft: "4px solid #8B5CF6",
                  borderTop: "3px solid #8B5CF6",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(139,92,246,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนถุงข้อสอบทั้งหมด
                    </div>
                    <Package size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {totalBags}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    ถุง
                  </div>
                </div>
              </div>
            </div>

            {/* Total Booklets */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div
                className="card shadow-sm h-100"
                style={{
                  borderLeft: "4px solid #EF4444",
                  borderTop: "3px solid #EF4444",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(239,68,68,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนสมุดข้อสอบทั้งหมด
                    </div>
                    <BookOpen size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {dashboardSummary?.rawBookletsCount?.toLocaleString() ?? 0}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    เล่ม
                  </div>
                </div>
              </div>
            </div>

            {/* Seat Assigned */}
            <div style={{ flex: "1 1 calc(20% - 0.75rem)", minWidth: 160 }}>
              <div
                className="card shadow-sm h-100"
                style={{
                  borderLeft: "4px solid #0EA5E9",
                  borderTop: "3px solid #0EA5E9",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(14,165,233,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body p-3 p-sm-4">
                  <div className="d-flex justify-content-between align-items-start mb-2 mb-sm-3">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted, fontSize: "0.8rem" }}>
                      จำนวนผู้เข้าสอบที่ถูกจัดสรรที่นั่งแล้ว
                    </div>
                    <Package size={18} className="opacity-75 d-none d-sm-block" style={{ color: muted }} />
                  </div>
                  <div className="h2 h-sm-3 mb-1 mb-sm-2 fw-bold" style={{ color: "#0F172A" }}>
                    {calculateUsers.toLocaleString()}
                  </div>
                  <div className="small d-none d-sm-block" style={{ color: muted }}>
                    คน
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="row g-3 g-md-4">
            {/* Score Distribution */}
            <div className="col-lg-7">
              <div className="card shadow-sm h-100" style={{ background: surface, borderTop: "3px solid #3B82F6" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <h6 className="mb-1 fw-bold">ช่วงคะแนนรวม</h6>
                  <small className="d-none d-sm-block" style={{ color: muted }}>
                    กราฟแสดงช่วงคะแนนรวมทั้งหมดทุกวิชา
                  </small>
                </div>

                <div className="card-body p-3 p-sm-4" style={{ minHeight: 300 }}>
                  {loadingCharts && !USE_MOCK_SCORE ? (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                      กำลังโหลดกราฟ...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scoreChartData}>
                        <XAxis dataKey="range" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(value) => [`${value} คน`, "จำนวน"]} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Bags by Session */}
            <div className="col-lg-5">
              <div className="d-flex flex-column gap-3 gap-md-4 h-100">
                <div style={{ background: surface }}>
                  {bagCounts.length > 0 && (
                    <div className="card shadow-sm" style={{ background: surface, borderTop: "3px solid #8B5CF6" }}>
                      <div className="card-header bg-white py-3 py-sm-4">
                        <h6 className="mb-0 fw-bold">จำนวนถุงข้อสอบในแต่ละวิชา</h6>
                      </div>
                      <div className="card-body p-3 p-sm-4" style={{ minHeight: 420 }}>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={bagCounts}
                              dataKey="bagCount"
                              nameKey="sessionLabel"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={3}
                              label={renderLabel}
                              labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                            >
                              {bagCounts.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number, name: string) => {
                                const item = bagCounts.find((b) => b.sessionLabel === name);
                                return [`${value} ถุง`, item?.sessionFullLabel ?? name];
                              }}
                              contentStyle={{
                                background: "#FFFFFF",
                                border: `1px solid ${border}`,
                                borderRadius: 10,
                                boxShadow: "0 6px 20px rgba(15, 69, 195, 0.08)",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Custom Legend */}
                        <div className="mt-3 d-flex flex-column gap-2">
                          {bagCounts.map((item, index) => (
                            <div key={item.sessionId} className="d-flex align-items-start gap-2">
                              <span
                                className="rounded-circle flex-shrink-0 mt-1"
                                style={{
                                  width: 10,
                                  height: 10,
                                  backgroundColor: pieColors[index % pieColors.length],
                                  display: "inline-block",
                                }}
                              />
                              <div className="small" style={{ color: "#334155", lineHeight: 1.3 }}>
                                <span className="fw-semibold">{item.sessionLabel}</span>{" "}
                                <span className="text-muted">
                                  ({(item as any).sessionFullLabel?.replace(`${item.sessionLabel} `, "") ?? ""})
                                </span>
                                <span className="ms-1 fw-bold" style={{ color: pieColors[index % pieColors.length] }}>
                                  {item.bagCount} ถุง
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary box */}
                <div className="card shadow-sm" style={{ background: surface, borderTop: "3px solid #10B981" }}>
                  <div className="card-body p-2 p-sm-3">
                    <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                      <div>
                        <div className="fw-bold mb-1 small" style={{ color: primary }}>
                          ผู้ตรวจ
                        </div>
                        <div className="h6 h-sm-5 mb-0" style={{ color: "#0F172A" }}>
                          {gradersCount} คน
                        </div>
                      </div>
                      <div className="text-start text-sm-end">
                        <div className="fw-bold mb-1 small" style={{ color: primary }}>
                          คีย์สำหรับการเข้ารหัส
                        </div>
                        <div className="h6 h-sm-5 mb-0" style={{ color: "#0F172A" }}>
                          {keysCount} คีย์
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject questions */}
            <div className="col-12">
              <div className="card shadow-sm" style={{ background: surface, borderLeft: "3px solid #F59E0B" }}>
                <div className="card-header bg-white py-2 py-sm-3">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold small">หัวข้อสอบในแต่ละวิชา</h6>
                    <span className="badge rounded-pill fw-semibold text-nowrap" style={badgeStyle("neutral")}>
                      โครงสร้างข้อสอบ
                    </span>
                  </div>
                </div>

                <div className="card-body p-2 p-sm-3" style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
                  {subjectQuestionList.length === 0 && (
                    <div className="text-muted small">ยังไม่มีการกำหนดหัวข้อในรายวิชา</div>
                  )}

                  {subjectQuestionList.map((subj) => (
                    <div
                      key={subj.subjectId}
                      className="mb-2 mb-sm-3 pb-2 pb-sm-3 border-bottom"
                      style={{ borderColor: "#E2E8F0" }}
                    >
                      <div className="mb-2">
                        <div className="fw-semibold text-dark" style={{ color: "#0F172A", fontSize: "0.95rem" }}>
                          {subj.name}
                        </div>
                        <div className="d-flex flex-column flex-sm-row gap-1 gap-sm-2 flex-wrap mt-1">
                          <small className="text-muted">รหัสวิชา: {subj.code}</small>
                          <small className="d-none d-sm-inline" style={{ color: "#CBD5E1" }}>
                            •
                          </small>
                          <small className="text-muted">{subj.questionCount} หัวข้อ</small>
                          <small className="d-none d-sm-inline" style={{ color: "#CBD5E1" }}>
                            •
                          </small>
                          <small className="text-muted">
                            คะแนนเต็ม: <span className="fw-semibold text-dark">{subj.totalMaxScore}</span>
                          </small>
                        </div>

                        {subj.sessionCodes && subj.sessionCodes.length > 0 && (
                          <div className="mt-1">
                            <small style={{ color: muted }}>
                              ลำดับวันสอบ:{" "}
                              <span className="fw-semibold text-dark">{subj.sessionCodes.join(" • ")}</span>
                            </small>
                          </div>
                        )}
                      </div>

                      <ul className="list-unstyled mb-0 ms-1 ms-sm-2" style={{ color: "#475569" }}>
                        {subj.questions.map((q) => (
                          <li
                            key={q.id}
                            className="d-flex justify-content-between align-items-end gap-1 gap-sm-2 mb-1 small"
                          >
                            <span className="flex-grow-1 text-break">
                              ข้อ {q.questionNo}: {q.label}
                            </span>
                            <span
                              className="badge bg-light text-dark border border-secondary flex-shrink-0 fw-semibold"
                              style={{ fontSize: "0.8rem" }}
                            >
                              {Number(q.maxScore).toLocaleString()} คะแนน
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grading Status Table */}
            {slotCoverage?.rawStatus && slotCoverage.rawStatus.length > 0 && (
              <div className="col-12">
                <div className="card shadow-sm" style={{ background: surface, borderLeft: "3px solid #0EA5E9" }}>
                  <div className="card-header bg-white py-2 py-sm-3">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                      <h6 className="mb-0 fw-bold small">สถานะการตรวจข้อสอบ</h6>
                      <span className="badge rounded-pill fw-semibold text-nowrap" style={badgeStyle("neutral")}>
                        รายละเอียด
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0" style={{ tableLayout: "fixed", width: "100%" }}>
                        <thead style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                          <tr>
                            <th className="px-3 py-2 small fw-semibold" style={{ color: primary, width: "25%" }}>
                              รอบสอบ/วิชา
                            </th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "10%" }}>
                              ผู้สอบ
                            </th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "10%" }}>
                              ข้อ
                            </th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "15%" }}>
                              ช่องตรวจคะแนนทั้งหมด
                            </th>
                            <th className="px-2 py-2 small fw-semibold text-center" style={{ color: primary, width: "25%" }}>
                              เสร็จ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {slotCoverage.rawStatus.map((item, idx) => {
                            const session = Object.values(dashboardSummary.sessions || {}).find((s) => s.sessionId === item.session_id);
                            const subject = Object.values(dashboardSummary.subjectQuestions || {}).find((s) => s.subjectId === item.subject_id);

                            const progressPercent =
                              item.expected_slots > 0 ? Math.round((Number(item.completed_slots) / item.expected_slots) * 100) : 0;

                            return (
                              <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                <td className="px-3 py-3">
                                  <div className="fw-semibold small" style={{ color: "#0F172A" }}>
                                    {session?.sessionCode || `Session ${item.session_id}`}
                                  </div>
                                  <div className="small text-muted text-truncate" style={{ maxWidth: "200px" }} title={subject?.name}>
                                    {subject?.name || `Subject ${item.subject_id}`}
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className="badge bg-light text-dark border small">{item.booklet_count}</span>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className="badge bg-light text-dark border small">{item.question_count}</span>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <div
                                    className="small fw-semibold"
                                    style={{ color: item.actual_slots === item.expected_slots ? "#059669" : "#DC2626" }}
                                  >
                                    {item.expected_slots}
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <div className="small fw-semibold mb-1" style={{ color: "#0891B2" }}>
                                    {item.completed_slots}/{item.expected_slots}
                                  </div>
                                  <div className="progress" style={{ height: "6px" }}>
                                    <div className="progress-bar bg-info" style={{ width: `${progressPercent}%` }} />
                                  </div>
                                  <div className="small text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                                    {progressPercent}%
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-2 p-sm-3 border-top" style={{ background: "#FAFAFA" }}>
                     {slotCoverage?.rawDisputedQuestions != null && (
                        <div className="mt-2 pt-2 border-top">
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning">
                            <strong>คำถามที่คะแนนห่างเกิน 4 ทั้งหมด:</strong> {slotCoverage.rawDisputedQuestions} ข้อ
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Operational Status (Lists) */}
          <section className="row g-3 g-md-4">
            {/* Import */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #F59E0B" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการนำเข้าข้อมูล</h6>
                    <span className="badge rounded-pill fw-semibold text-nowrap" style={badgeStyle("neutral")}>
                      รายวิชา
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {importStatusList.map((s) => {
                      let tone: Tone = "neutral";
                      let textStatus = "รอการนำเข้า";
                      if (s.importStatus === "IMPORTED") {
                        tone = "good";
                        textStatus = "เรียบร้อย";
                      } else if (s.importStatus === "PARTIAL") {
                        tone = "warn";
                        textStatus = "บางส่วน";
                      }

                      return (
                        <div
                          key={s.sessionId}
                          className="list-group-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                        >
                          <div className="flex-grow-1">
                            <div className="fw-medium text-dark small">
                              {s.sessionCode} {s.subject_name}
                            </div>
                            <div className="small text-nowrap" style={{ color: muted, fontSize: "0.75rem" }}>
                              ผู้เข้าสอบ: {s.inSession} / {s.inCampaign} คน
                            </div>
                          </div>
                          <span className="badge rounded-pill fw-semibold text-nowrap flex-shrink-0" style={badgeStyle(tone)}>
                            {textStatus}
                          </span>
                        </div>
                      );
                    })}

                    {importStatusList.length === 0 && (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลรอบสอบ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Encryption */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #8B5CF6" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการเข้ารหัสข้อมูลเพื่อสร้างคิวอาร์โค้ด</h6>
                    <span className="badge rounded-pill fw-semibold text-nowrap" style={badgeStyle("neutral")}>
                      รายวิชา
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {encryptedStatusList.map((s) => {
                      let tone: Tone = "neutral";
                      let textStatus = "ยังไม่ทำ";
                      if (s.status === "ENCRYPTED_ALL") {
                        tone = "good";
                        textStatus = "เรียบร้อย";
                      } else if (s.status === "PARTIAL") {
                        tone = "warn";
                        textStatus = `ค้าง ${s.pending}`;
                      }

                      return (
                        <div
                          key={s.sessionId}
                          className="list-group-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                        >
                          <div className="flex-grow-1">
                            <div className="fw-medium text-dark small">
                              {s.sessionCode} {s.subject_name}
                            </div>
                            <div className="small text-nowrap" style={{ color: muted, fontSize: "0.75rem" }}>
                              เข้ารหัสแล้ว: {s.encrypted} / {s.totalUsersInSession} คน
                            </div>
                          </div>
                          <span className="badge rounded-pill fw-semibold text-nowrap flex-shrink-0" style={badgeStyle(tone)}>
                            {textStatus}
                          </span>
                        </div>
                      );
                    })}

                    {encryptedStatusList.length === 0 && (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลรอบสอบ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Seat Assignment */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #22C55E" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการจัดสรรที่นั่งสอบ</h6>
                    <span className="badge rounded-pill fw-semibold text-nowrap" style={badgeStyle("neutral")}>
                      ห้องสอบ
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {dashboardSummary?.seatAssignmentStatus && dashboardSummary.seatAssignmentStatus.length > 0 ? (
                      dashboardSummary.seatAssignmentStatus.map((item, idx) => {
                        const occupancyPercent = item.capacity > 0 ? Math.round((item.count_user / item.capacity) * 100) : 0;
                        const tone: Tone = item.count_user === item.capacity ? "good" : "neutral";

                        return (
                          <div
                            key={idx}
                            className="list-group-item border-bottom d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                          >
                            <div className="flex-grow-1">
                              <div className="fw-medium text-dark small">{item.room_code}</div>
                              <div className="small text-nowrap" style={{ color: muted, fontSize: "0.75rem" }}>
                                จัดสรรที่นั่งผู้เข้าสอบแล้ว: {item.count_user} / {item.capacity} คน
                              </div>
                            </div>
                            <span className="badge rounded-pill fw-semibold text-nowrap flex-shrink-0" style={badgeStyle(tone)}>
                              {occupancyPercent}%
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลการจัดสรรที่นั่งสอบ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Booklets by Session */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface, borderLeft: "3px solid #EF4444" }}>
                <div className="card-header bg-white py-3 py-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                    <h6 className="mb-0 fw-bold">สถานะการนำเส่งเล่มข้อสอบ (ลงถุง)</h6>
                    <span className="badge rounded-pill fw-semibold text-nowrap" style={badgeStyle("neutral")}>
                      จำนวนสมุดข้อสอบ
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="list-group list-group-flush">
                    {dashboardSummary?.rawBookletsBySession && dashboardSummary.rawBookletsBySession.length > 0 ? (
                      dashboardSummary.rawBookletsBySession.map((item) => (
                        <div
                          key={item.session_id}
                          className="list-group-item border-bottom d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between py-2 py-sm-3 gap-2"
                        >
                          <div className="flex-grow-1">
                            <div className="fw-medium text-dark small">
                              {item.session_code} {item.subject_name}
                            </div>
                          </div>
                          <span className="rounded-pill fw-semibold text-nowrap flex-shrink-0">{item.count} เล่ม</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center" style={{ color: muted }}>
                        ไม่มีข้อมูลการนำเส่ง
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* คะแนนเฉลี่ยรายข้อตาม Session (charts endpoint) */}
          {dashboardCharts?.rawAverageQuestionScore &&
            Object.keys(dashboardCharts.rawAverageQuestionScore).length > 0 && (
              <section className="row g-3 g-md-4">
                <div className="col-12">
                  <div className="card shadow-sm" style={{ background: surface, borderTop: "3px solid #0EA5E9" }}>
                    <div className="card-header bg-white py-3 py-sm-4">
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                        <div>
                          <h6 className="mb-1 fw-bold">คะแนนเฉลี่ยรายข้อ</h6>
                          <small style={{ color: muted }}>กราฟแสดงคะแนนเฉลี่ยของแต่ละข้อตามรอบสอบที่เลือก</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <label className="small text-muted mb-0">เลือกรอบสอบ:</label>
                          <select
                            className="form-select form-select-sm"
                            style={{ minWidth: 200 }}
                            value={selectedAvgSessionId ?? ""}
                            onChange={(e) => setSelectedAvgSessionId(e.target.value || null)}
                          >
                            {avgScoreSessionOptions.map((opt) => (
                              <option key={opt.sessionId} value={opt.sessionId}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="card-body p-3 p-sm-4" style={{ minHeight: 400 }}>
                      {avgQuestionChartData.length === 0 ? (
                        <div className="h-100 d-flex align-items-center justify-content-center text-muted">
                          ยังไม่มีข้อมูลคะแนนเฉลี่ยสำหรับรอบสอบนี้
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={350}>
                          <BarChart data={avgQuestionChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="fullLabel"
                              tick={{ fontSize: 10, fill: primary }}
                              angle={-35}
                              textAnchor="end"
                              height={80}
                              interval={0}
                            />
                            <YAxis
                              tick={{ fontSize: 11, fill: muted }}
                              domain={[0, "auto"]}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: "rgba(14, 165, 233, 0.1)" }}
                              formatter={(value: number) => [`${Number(value).toFixed(2)} คะแนน`, "คะแนนเฉลี่ย"]}
                              contentStyle={{
                                background: "rgba(255, 255, 255, 0.98)",
                                border: "none",
                                borderRadius: 12,
                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                                padding: "12px 16px",
                              }}
                              labelStyle={{ fontWeight: 600, color: primary, marginBottom: 4 }}
                            />
                            <Bar
                              dataKey="avgScore"
                              fill="#0EA5E9"
                              radius={[8, 8, 0, 0]}
                              maxBarSize={60}
                              label={{
                                position: "top",
                                fill: "#0EA5E9",
                                fontSize: 11,
                                fontWeight: 600,
                                formatter: (value: number) => value.toFixed(1),
                              }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {avgQuestionChartData.length > 0 && (
                        <div className="mt-4 pt-4 border-top">
                          <h6 className="small fw-bold mb-3" style={{ color: primary }}>
                            รายละเอียดคะแนนเฉลี่ยแต่ละข้อ
                          </h6>
                          <div className="row g-3">
                            {avgQuestionChartData.map((item) => (
                              <div key={item.questionNo} className="col-12 col-sm-6 col-lg-4">
                                <div className="p-3 rounded-3 h-100" style={{ background: "#f8f9fa", border: "1px solid #dee2e6" }}>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <span
                                      className="badge rounded-pill"
                                      style={{ background: "#212529", color: "#fff", fontSize: "0.7rem", padding: "4px 10px" }}
                                    >
                                      ข้อ {item.questionNo}
                                    </span>
                                    <span className="fw-bold" style={{ color: "#212529", fontSize: "1.25rem" }}>
                                      {item.avgScore.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="small" style={{ color: "#495057", lineHeight: 1.4 }}>
                                    {item.fullLabel}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
        </>
      </div>
    </ShowIfCan>
  );
}
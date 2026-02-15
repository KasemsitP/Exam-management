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
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, GraduationCap, Package, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hook";
import { selectActiveCampaign } from "@/store/slices/examData.slice";
import { selectDefaultBagCapacity, selectBagsForCampaign, fetchBagsForCampaignThunk } from "@/store/slices/bags.slice";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { useDispatch } from "react-redux";
import { ShowIfCan } from "@/components/auth/ShowIfCan";

/* -----------------------------------------
   ✅ Muted / Neutral theme (ไม่ฉูดฉาด)
------------------------------------------ */
const primary = "#334155"; // slate-700
const muted = "#64748B"; // slate-500
const grid = "#E2E8F0"; // slate-200
const surface = "#FFFFFF";
const surfaceSoft = "#F8FAFC"; // slate-50
const border = "#E2E8F0"; // slate-200
const pieColors = [
  "#3B82F6", // น้ำเงินสด (Blue)
  "#22C55E", // เขียวสด (Green)
  "#F59E0B", // เหลือง/ส้ม (Amber)
  "#EF4444", // แดงสด (Red)
  "#8B5CF6", // ม่วงสด (Violet)
];


/* ---------- 1. Types ที่ตรงกับ API Response จริง ---------- */

// จาก JSON ที่คุณให้มา
// {
//   "summary": {...},
//   "sessions": {...},
//   "avgScorePerQuestion": []
// }
const MOCK_SCORE_DISTRIBUTION: ScoreDistributionAPI = {
  totalUsers: 1105,
  noScore: 0,
buckets: [
  { label: "1-5", count: 12 },     // โดดซ้าย
  { label: "6-10", count: 8 },
  { label: "11-15", count: 22 },   // spike
  { label: "16-20", count: 18 },
  { label: "21-25", count: 45 },
  { label: "26-30", count: 38 },   // ดรอปนิด
  { label: "31-35", count: 72 },
  { label: "36-40", count: 60 },   // ลดแบบไม่เนียน
  { label: "41-45", count: 98 },
  { label: "46-50", count: 110 },
  { label: "51-55", count: 95 },   // ยุบลง
  { label: "56-60", count: 130 },  // spike กลาง
  { label: "61-65", count: 102 },
  { label: "66-70", count: 115 },  // โดดอีกที
  { label: "71-75", count: 88 },
  { label: "76-80", count: 93 },   // เด้งขึ้นนิด
  { label: "81-85", count: 65 },
  { label: "86-90", count: 58 },
  { label: "91-95", count: 52 },
  { label: "96-100", count: 34 },
  { label: "101-105", count: 40 }, // spike ขวากลาง
  { label: "106-110", count: 18 },
  { label: "111-115", count: 26 }, // เด้งอีกที
  { label: "116-120", count: 9 },
  { label: "121-125", count: 14 }, // ขวาโดด
  { label: "126-130", count: 4 },
  { label: "131-135", count: 7 },  // spike เล็ก
  { label: "136-140", count: 2 },
  { label: "141-145", count: 5 },  // ขวาปลายโดด
  { label: "146-150", count: 1 },
  { label: "151-155", count: 1 },
  { label: "156-160", count: 1 },
  { label: "161-165", count: 1 },
  { label: "166-170", count: 1 },
]

};



interface ScoreBucket {
  label: string; // "0-4", "5-9", ...
  count: number;
}

interface ScoreDistributionAPI {
  totalUsers: number;
  noScore: number;
  buckets: ScoreBucket[];
}

interface SummaryAPI {
  campaignId: number;
  sessionCount: number;
  subjectCount: number;
  graders: {
    total: number;
    withLogin: number;
  };
  keys: {
    total: number;
    active: number;
  };
  scoreDistribution: ScoreDistributionAPI;
}

interface SessionAPI {
  sessionId: number;
  sessionCode: string;
  subject_name: string;
  bags: {
    total: number;
    capacity: number;
  };
  users: {
    inCampaign: number;
    inSession: number;
  };
  importStatus: "NOT_IMPORTED" | "PARTIAL" | "IMPORTED";
  encryption: {
    status: "NOT_ENCRYPTED" | "PARTIAL" | "ENCRYPTED_ALL";
    encrypted: number;
    pending: number;
  };
}
interface SubjectQuestion {
  id: number;
  questionNo: number;
  label: string;
  maxScore: string; // หรือ number ถ้า backend ส่งมาเป็น number จริง ๆ
}

interface SubjectDetail {
  subjectId: number;
  code: string;
  name: string;
  questions: SubjectQuestion[];
}
interface SubjectQuestionApi {
  id: number;
  questionNo: number;
  label: string;
  maxScore: string; // หรือ number ถ้า backend แปลงมาแล้ว
}

interface SubjectQuestionsApi {
  subjectId: number;
  code: string;
  name: string;
  questions: SubjectQuestionApi[];
}

interface DashboardApiResponse {
  summary: SummaryAPI;
  sessions: Record<string, SessionAPI>;
  avgScorePerQuestion: any[];
  subjectQuestions?: Record<string, SubjectQuestionsApi>;
}

/* ---------- Types ฝั่ง UI (สำหรับกราฟและการแสดงผล) ---------- */

interface BagCount {
  sessionId: number;
  sessionLabel: string;
  bagCount: number;
  [key: string]: any; // ให้ recharts พอใจ
}

interface ImportStatusUI {
  sessionId: number;
  sessionCode: string;
  subject_name: string
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
      background: "#F1F5F9",
      color: "#0F172A",
      border: "1px solid #CBD5E1",
    };
  if (tone === "warn")
    return {
      background: "#F8FAFC",
      color: "#334155",
      border: "1px solid #CBD5E1",
    };
  return {
    background: "#F8FAFC",
    color: "#475569",
    border: "1px solid #E2E8F0",
  };
};

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const activeCampaign = useAppSelector(selectActiveCampaign);
  const defaultBagCapacity = useAppSelector(selectDefaultBagCapacity);
  const user = useAppSelector(selectCurrentUser);


  const bags = useAppSelector(selectBagsForCampaign(activeCampaign?.id))

  /* ---------- Local state ---------- */
  const [dashboardData, setDashboardData] = useState<DashboardApiResponse | null>(
    null
  );
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [scoreChartData, setScoreChartData] = useState<
    { range: string; count: number }[]
  >([]);


  useEffect(() => {

    console.log(bags)
  }, [])
  useEffect(() => {
    if (!activeCampaign?.id) return;

    const fetchDashboard = async () => {
      try {
        setLoadingDashboard(true);
        setDashboardError(null);

        dispatch(fetchBagsForCampaignThunk(activeCampaign.id))

        const res = await axios.get<DashboardApiResponse>(
          `http://localhost:8000/api/dashboard/campaign/${activeCampaign.id}`
        );

        console.log("Dashboard API:", res.data);
        setDashboardData(res.data);
      } catch (err: any) {
        console.error("Fetch dashboard error:", err);
        setDashboardError("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ หรือเชื่อมต่อ Server ไม่ได้");
        setDashboardData(null);
      } finally {
        setLoadingDashboard(false);
      }
    };

    fetchDashboard();
  }, [activeCampaign?.id]);

  const USE_MOCK_SCORE = true; // <-- เปลี่ยนเป็น false ตอนอยากกลับไปใช้ของจริง

  useEffect(() => {
    if (USE_MOCK_SCORE) {
      const chartData = buildScoreChartData(MOCK_SCORE_DISTRIBUTION);
      setScoreChartData(chartData);
      return;
    }

    if (!dashboardData?.summary?.scoreDistribution) return;

    const chartData = buildScoreChartData(
      dashboardData.summary.scoreDistribution
    );
    setScoreChartData(chartData);
  }, [dashboardData]);


  // 1) กำหนดช่วงทั้งหมดที่อยากให้แสดง 1–150 (ก้าวละ 5 คะแนน)
  const ALL_SCORE_BUCKETS: string[] = [];
  for (let start = 1; start <= 170; start += 5) {
    const end = start + 4;
    ALL_SCORE_BUCKETS.push(`${start}-${end}`); // "1-5", "6-10", ..., "146-150"
  }

  // ....

  const buildScoreChartData = (scoreDistribution: ScoreDistributionAPI) => {
    if (!scoreDistribution) return [];

    const { buckets, noScore } = scoreDistribution;

    // map label -> count (ดึงจาก backend)
    const bucketMap = new Map<string, number>();
    for (const b of buckets ?? []) {
      bucketMap.set(b.label, Number(b.count ?? 0));
    }

    // สร้างข้อมูลสำหรับทุกช่วง 1–150
    const bucketData = ALL_SCORE_BUCKETS.map((label) => ({
      range: label,
      count: bucketMap.get(label) ?? 0, // ถ้าไม่มีใน backend ให้เป็น 0
    }));

    // แถมแท่ง "ยังไม่มีคะแนน" อีกช่อง
    bucketData.push({
      range: "ยังไม่มีคะแนน",
      count: Number(noScore ?? 0),
    });

    return bucketData;
  };



  /* ---------- Derived Data (แปลง API -> UI) ---------- */

  // 1) Import status จาก sessions
  const importStatusList: ImportStatusUI[] = useMemo(() => {
    if (!dashboardData?.sessions) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      inCampaign: s.users.inCampaign,
      inSession: s.users.inSession,
      importStatus: s.importStatus,
      subject_name: s.subject_name
    }));
  }, [dashboardData]);

  // 2) Encryption จาก sessions
  const encryptedStatusList: EncryptedStatusUI[] = useMemo(() => {
    if (!dashboardData?.sessions) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionCode: s.sessionCode,
      status: s.encryption.status,
      encrypted: s.encryption.encrypted,
      pending: s.encryption.pending,
      // ใช้จำนวนผู้เข้าสอบใน session เป็นตัวหาร
      totalUsersInSession: s.users.inSession,
      subject_name: s.subject_name
    }));
  }, [dashboardData]);

  // 3) จำนวนรอบสอบ
  const sessionCount = useMemo(() => {
    if (!dashboardData) return 0;
    if (dashboardData.summary?.sessionCount != null) {
      return dashboardData.summary.sessionCount;
    }
    return Object.keys(dashboardData.sessions ?? {}).length;
  }, [dashboardData]);

  // 4) จำนวนวิชา
  const subjectCount = dashboardData?.summary?.subjectCount ?? 0;

  // 5) จำนวนผู้เข้าสอบรวมทั้ง campaign (ใช้จาก summary โดยตรงจะไม่ซ้ำคน)
  const totalUsersInCampaign = useMemo(() => {
    if (!dashboardData?.sessions) return 0;

    const sessionsArr = Object.values(dashboardData.sessions);

    // เผื่ออนาคตบาง session หลุดข้อมูล ใช้ค่ามากสุดกันพลาด
    return sessionsArr.reduce(
      (max, s) => Math.max(max, s.users.inCampaign),
      0
    );
  }, [dashboardData]);

  // 6) จำนวนถุงรวมทั้ง campaign
  const totalBags = useMemo(() => {
    if (!dashboardData?.sessions) return 0;
    return Object.values(dashboardData.sessions).reduce(
      (sum, s) => sum + (s.bags?.total ?? 0),
      0
    );
  }, [dashboardData]);

  // 7) ผู้ตรวจ / keys จาก summary
  const gradersCount = dashboardData?.summary?.graders?.total ?? 0;
  const keysCount = dashboardData?.summary?.keys?.total ?? 0;

  // 8) สำหรับ PieChart ถุงตามรอบสอบ (ใช้ใน card ท้ายไฟล์)
  const bagCounts: BagCount[] = useMemo(() => {
    if (!dashboardData?.sessions) return [];
    return Object.values(dashboardData.sessions).map((s) => ({
      sessionId: s.sessionId,
      sessionLabel: `${s.sessionCode} (${s.subject_name ?? "-"})`,
      bagCount: s.bags.total,
      //  subject_name: s.subject_name
    }));
  }, [dashboardData]);

  const subjectQuestionList = useMemo(() => {
    if (!dashboardData?.subjectQuestions) return [];

    // map: ชื่อวิชา -> list ของ sessionCode
    const sessionsBySubjectName: Record<string, string[]> = {};

    if (dashboardData.sessions) {
      Object.values(dashboardData.sessions).forEach((s) => {
        if (!s.subject_name) return;

        // กรณีที่ subject_name อนาคตอาจเป็นหลายวิชา แล้วใช้ GROUP_CONCAT
        const names = String(s.subject_name)
          .split(",")
          .map((n) => n.trim())
          .filter(Boolean);

        names.forEach((name) => {
          if (!sessionsBySubjectName[name]) {
            sessionsBySubjectName[name] = [];
          }
          sessionsBySubjectName[name].push(s.sessionCode);
        });
      });
    }

    // คืน array ของวิชา + sessionCodes
    return Object.values(dashboardData.subjectQuestions).map((subj) => ({
      subjectId: subj.subjectId,
      code: subj.code,
      name: subj.name,
      questions: subj.questions,
      // จำนวนหัวข้อ
      questionCount: subj.questions.length,
      // คะแนนเต็มรวมทั้งวิชา
      totalMaxScore: subj.questions.reduce(
        (sum, q) => sum + Number(q.maxScore ?? 0),
        0
      ),
      // รอบสอบที่วิชานี้ไปอยู่
      sessionCodes: sessionsBySubjectName[subj.name] ?? [],
    }));
  }, [dashboardData?.subjectQuestions, dashboardData?.sessions]);


  // 2) ใช้ทั้ง subjectQuestions + sessions เพื่อทำข้อความสรุป
  const subjectNamesSummary = useMemo(() => {
    if (!dashboardData?.subjectQuestions || !dashboardData?.sessions) return "";

    // สร้าง map: subject_name → [sessionCode...]
    const sessionCodesBySubjectName: Record<string, string[]> = {};

    Object.values(dashboardData.sessions).forEach((s) => {
      if (!s.subject_name) return;
      if (!sessionCodesBySubjectName[s.subject_name]) {
        sessionCodesBySubjectName[s.subject_name] = [];
      }
      sessionCodesBySubjectName[s.subject_name].push(s.sessionCode);
    });

    // จาก subjectQuestions มาต่อ string
    const subjects = Object.values(dashboardData.subjectQuestions).map((s) => {
      const sessionsForSubject = sessionCodesBySubjectName[s.name] ?? [];
      const sessionText =
        sessionsForSubject.length > 0
          ? ` (สอบใน ${sessionsForSubject.join(", ")})`
          : "";

      // ตัวอย่าง: "LAWENG - กฎหมายพิเศษและภาษาอังกฤษ (สอบใน วันที่ 1)"
      return `${s.code} - ${s.name}${sessionText}`;
    });

    if (subjects.length === 0) return "";
    if (subjects.length <= 2) return subjects.join(" • ");

    return `${subjects.slice(0, 2).join(" • ")} + อีก ${subjects.length - 2} วิชา`;
  }, [dashboardData]);


  const renderLabel = (props: PieLabelRenderProps) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      value,
    } = props;

    // Guard type ให้เป็น number เท่านั้น
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

    const radius = innerRadius + (outerRadius - innerRadius) / 2;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
        fill="#fff"
        pointerEvents="none"
      >
        {value}
      </text>
    );
  };
  // รายวิชาทั้งหมดจาก subjectQuestion

  const sessionsBySubjectName = useMemo(() => {
    if (!dashboardData?.sessions) return {} as Record<string, string[]>;

    const map: Record<string, string[]> = {};

    Object.values(dashboardData.sessions).forEach((sess) => {
      if (!sess.subject_name) return;

      if (!map[sess.subject_name]) {
        map[sess.subject_name] = [];
      }
      map[sess.subject_name].push(sess.sessionCode);  // เช่น "วันที่ 1", "วันที่ 2"
    });

    return map;
  }, [dashboardData?.sessions]);
  const subjectList = useMemo(() => {
    if (!dashboardData?.subjectQuestions) return [];

    return Object.values(dashboardData.subjectQuestions).map((subj) => {
      // หา session ของวิชานี้จากชื่อวิชา
      const sessionCodes = sessionsBySubjectName[subj.name] ?? [];

      return {
        subjectId: subj.subjectId,
        code: subj.code,
        name: subj.name,
        questionCount: subj.questions.length,
        totalMaxScore: subj.questions.reduce(
          (sum, q) => sum + Number(q.maxScore ?? 0),
          0
        ),
        sessions: sessionCodes,          // <= เพิ่ม field นี้
      };
    });
  }, [dashboardData?.subjectQuestions, sessionsBySubjectName]);


  /* ---------- Render ---------- */

  return (
    <ShowIfCan permission="dashboard" fallback={<div className="p-4 alert alert-warning">คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดนี้</div>}>
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="card border-0 shadow-sm" style={{ background: surface }}>
        <div className="card-body p-4 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div>
              <div className="text-uppercase small fw-semibold mb-1" style={{ color: muted }}>
                Dashboard
              </div>
              <h2 className="h4 mb-1  text-dark">
                {activeCampaign ? `${activeCampaign.name}` : "ยังไม่ได้เลือกแคมเปญ"}
              </h2>
              <div className="d-flex align-items-center gap-2 small" style={{ color: muted }}>
                {/* <span>
                  Login โดย: {user?.name ?? "Guest"} ({user?.roles?.join(", ")})
                </span> */}
              </div>
            </div>
          </div>

          <div className="d-flex flex-column align-items-md-end gap-2"></div>
        </div>
      </div>

      {/* Loading State */}
      {loadingDashboard ? (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <div className="spinner-border mb-3" style={{ color: primary }} role="status"></div>
          <div style={{ color: muted }}>กำลังโหลดข้อมูลจาก Server...</div>
        </div>
      ) : (
        <>
          {dashboardError && (
            <div className="alert alert-danger shadow-sm border-0">{dashboardError}</div>
          )}

          {/* Stat Cards */}
          <section className="row g-3">
            {/* Sessions */}
            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start "
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      จำนวนรายวิชาที่สอบทั้งหมด
                    </div>
                    <CalendarDays size={18} className="opacity-75" style={{ color: muted }} />
                  </div>
                  <div className="h2 mb-1 fw-bold" style={{ color: "#0F172A" }}>
                    {sessionCount}
                  </div>
                  <div className="small" style={{ color: muted }}>
                    วิชา
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects */}  {/* border-4 กรอบใหญ่ขึ้น */}
            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start "
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      รายวิชาที่สอบทั้งหมด
                    </div>
                    <GraduationCap size={18} className="opacity-75" style={{ color: muted }} />
                  </div>


                  {subjectList.length > 0 && (
                    <ul className="list-unstyled mb-0 text-dark" style={{ color: muted }}>
                      {subjectList.slice(0, 3).map((subj) => (
                        <li key={subj.subjectId} className="fw-bold">
                          {subj.name}
                        </li>
                      ))}

                      {subjectList.length > 3 && (
                        <li className="fst-italic">
                          + อีก {subjectList.length - 3} วิชา
                        </li>
                      )}
                    </ul>
                  )}
                </div>


              </div>
            </div>

            {/* Total Users */}

            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start"
                style={{ borderLeftColor: "#CBD5E1" }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      ผู้เข้าสอบภายในรอบสอบนี้
                    </div>
                    <Users size={18} className="opacity-75" style={{ color: muted }} />
                  </div>
                  <div className="h2 mb-1 fw-bold" style={{ color: "#0F172A" }}>
                    {totalUsersInCampaign.toLocaleString()}
                  </div>
                  <div className="small" style={{ color: muted }}>
                    คน
                  </div>
                </div>
              </div>
            </div>



            {/* Bags */}
            <div className="col-lg-3 col-sm-6">
              <div
                className="card shadow-sm h-100 border-start "
                style={{ borderLeftColor: "#CBD5E1" }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="small text-uppercase fw-semibold" style={{ color: muted }}>
                      จำนวนถุงข้อสอบในรอบสอบ
                    </div>
                    <Package size={18} className="opacity-75" style={{ color: muted }} />
                  </div>
                  <div className="h2 mb-1 fw-bold" style={{ color: "#0F172A" }}>
                    {totalBags}
                  </div>
                  <div className="small" style={{ color: muted }}>
                    ถุง (ความจุมาตรฐาน {defaultBagCapacity})
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Charts (ยังเป็น placeholder ตาม UI เดิม) */}
          <section className="row g-3">
            {/* Score Distribution placeholder */}
            <div className="col-lg-8">
              <div className="card shadow-sm h-100" style={{ background: surface }}>
                <div className="card-header bg-white py-3">
                  <h6 className="mb-0 fw-bold">ช่วงคะแนนรวม</h6>
                  <small style={{ color: muted }}>
                    กราฟแสดงช่วงคะแนนรวมทั้งหมดทุกวิชา
                  </small>
                </div>
                <div className="card-body" style={{ height: 320 }}>
                  <div
                    className="h-100 d-flex align-items-center justify-content-center rounded"
                    style={{
                      color: muted,
                      background: surfaceSoft,
                      border: `1px dashed ${border}`,
                    }}
                  >
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={scoreChartData}>
                        <XAxis dataKey="range" />
                        <YAxis allowDecimals={false} />
                        <Tooltip formatter={(value) => [`${value} คน`, "จำนวน"]} />
                        <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Bags by Session placeholder */}
            <div className="col-lg-4">
              <div className="d-flex flex-column gap-3 h-100">
                <div className="" style={{ background: surface }}>
                  {bagCounts.length > 0 && (
                    <div className="card shadow-sm" style={{ background: surface }}>
                      <div className="card-header bg-white py-3">
                        <h6 className="mb-0 fw-bold">จำนวนถุงข้อสอบในแต่วิชา </h6>
                      </div>
                      <div className="card-body" style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={bagCounts}
                              dataKey="bagCount"
                              nameKey="sessionLabel"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={4}
                              label={renderLabel}
                              labelLine={false}
                            >
                              {bagCounts.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={pieColors[index % pieColors.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "#FFFFFF",
                                border: `1px solid ${border}`,
                                borderRadius: 10,
                                boxShadow: "0 6px 20px rgba(15, 69, 195, 0.08)",
                              }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary box - muted */}
                <div className="card shadow-sm border-0" style={{ background: surface }}>
                  <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                      <div className="fw-bold mb-1" style={{ color: primary }}>
                        ผู้ตรวจ
                      </div>
                      <div className="h5 mb-0" style={{ color: "#0F172A" }}>
                        {gradersCount} คน
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold mb-1" style={{ color: primary }}>
                        คีย์สำหรับการเข้ารหัส
                      </div>
                      <div className="h5 mb-0" style={{ color: "#0F172A" }}>
                        {keysCount} คีย์
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card shadow-sm" style={{ background: surface }}>
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">หัวข้อสอบในแต่ละวิชา</h6>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={badgeStyle("neutral")}
                  >
                    โครงสร้างข้อสอบ
                  </span>
                </div>

                <div
                  className="card-body"
                  style={{ maxHeight: 320, overflowY: "auto" }} // เลื่อนดูได้ ถ้าหัวข้อเยอะ
                >
                  {subjectQuestionList.length === 0 && (
                    <div className="text-muted small">
                      ยังไม่มีการกำหนดหัวข้อในรายวิชา
                    </div>
                  )}

                  {subjectQuestionList.map((subj) => {
                    return (
                      <div
                        key={subj.subjectId}
                        className="mb-3 pb-2 border-bottom"
                        style={{ borderColor: "#E2E8F0" }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold" style={{ color: "#0F172A" }}>
                              {subj.code} - {subj.name}
                            </div>

                            {/* จำนวนหัวข้อ + คะแนนเต็มรวม */}
                            <div className="small" style={{ color: muted }}>
                              {subj.questionCount} หัวข้อ | คะแนนเต็มรวม{" "}
                              {subj.totalMaxScore}
                            </div>

                            {/* ⬇⬇ แสดงรอบสอบที่วิชานี้เปิดสอบ ⬇⬇ */}
                            {subj.sessionCodes && subj.sessionCodes.length > 0 && (
                              <div className="small" style={{ color: muted }}>
                                ลำดับวันสอบ:{" "}
                                {subj.sessionCodes.join(" • ")}
                                {/* เช่น "วันที่ 1 • วันที่ 2" */}
                              </div>
                            )}
                          </div>
                        </div>

                        <ul className="small mt-2 mb-0" style={{ color: "#475569" }}>
                          {subj.questions.map((q) => (
                            <li
                              key={q.id}
                              className="d-flex justify-content-between align-items-center mb-1"
                            >
                              <span>
                                ข้อ {q.questionNo}: {q.label}
                              </span>
                              <span className="text-muted">
                                {Number(q.maxScore).toLocaleString()} คะแนน
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          </section>

          {/* Operational Status (Lists) */}
          <section className="row g-3">
            {/* Import */}
            <div className="col-lg-6">
              <div className="card shadow-sm h-100" style={{ background: surface }}>
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">สถานะการนำเข้าข้อมูล</h6>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={badgeStyle("neutral")}
                  >
                    รายวิชา
                  </span>
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
                          className="list-group-item d-flex align-items-center justify-content-between py-3"
                        >
                          <div>
                            <div className="fw-medium text-dark">{s.sessionCode} {s.subject_name}</div>
                            <div className="small" style={{ color: muted }}>
                              ผู้เข้าสอบ: {s.inSession} / {s.inCampaign} คน
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold"
                            style={badgeStyle(tone)}
                          >
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
              <div className="card shadow-sm h-100" style={{ background: surface }}>
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">สถานะการเข้ารหัสข้อมูลเพื่อสร้างคิวอาร์โค้ด</h6>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={badgeStyle("neutral")}
                  >
                    รายวิชา
                  </span>
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
                          className="list-group-item d-flex align-items-center justify-content-between py-3"
                        >
                          <div>
                            <div className="fw-medium text-dark">{s.sessionCode} {s.subject_name} </div>
                            <div className="small" style={{ color: muted }}>
                              เข้ารหัสแล้ว: {s.encrypted} / {s.totalUsersInSession} คน
                            </div>
                          </div>
                          <span
                            className="badge rounded-pill fw-semibold"
                            style={badgeStyle(tone)}
                          >
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
          </section>

          {/* PieChart ตามรอบสอบ (UI เดิมที่มีอยู่แล้ว) */}
          {/* {bagCounts.length > 0 && (
            <div className="card shadow-sm" style={{ background: surface }}>
              <div className="card-header bg-white py-3">
                <h6 className="mb-0 fw-bold">สัดส่วนถุงข้อสอบแบ่งตามวันที่สอบ</h6>
              </div>
              <div className="card-body" style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bagCounts}
                      dataKey="bagCount"
                      nameKey="sessionLabel"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {bagCounts.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: `1px solid ${border}`,
                        borderRadius: 10,
                        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.08)",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )} */}
        </>
      )}
    </div>
    </ShowIfCan>
  );
}
